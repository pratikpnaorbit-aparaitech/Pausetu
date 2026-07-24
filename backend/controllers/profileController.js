const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { getUploadedFileUrl } = require('../services/uploadService');
const { cloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

/**
 * Mobile number format validation (10-digit Indian numbers starting with 6-9)
 */
const isValidMobile = (mobile) => {
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
};

/**
 * Get User Profile - GET /api/profile
 */
exports.getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user) {
    return next(new AppError('User profile not found', 404));
  }

  // Filter out local profilePhoto if file doesn't exist on disk (Cloudinary URLs are preserved)
  if (user.profilePhoto && typeof user.profilePhoto === 'string' && !user.profilePhoto.startsWith('http://') && !user.profilePhoto.startsWith('https://')) {
    const fs = require('fs');
    const path = require('path');
    const localPath = path.join(__dirname, '..', user.profilePhoto.startsWith('/') ? user.profilePhoto.substring(1) : user.profilePhoto);
    if (!fs.existsSync(localPath)) {
      user.profilePhoto = null;
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

/**
 * Update User Profile - PUT /api/profile
 */
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError('User profile not found', 404));
  }

  const {
    fullName,
    profilePhoto,
    mobile,
    village,
    taluka,
    district,
    state,
    preferredLanguage
  } = req.body;

  // 1. Mobile number validation & verification tracking (if provided)
  if (mobile !== undefined) {
    if (mobile === '') {
      user.mobile = undefined;
    } else {
      const trimmedMobile = mobile.trim();
      if (!isValidMobile(trimmedMobile)) {
        return next(new AppError('Please provide a valid 10-digit mobile number', 400));
      }
      // Re-verification is triggered ONLY when mobile number actually changes from stored value
      if (user.mobile && user.mobile !== trimmedMobile && user.verification && user.verification.status === 'approved') {
        user.verification.status = 'unverified';
        user.verification.approvedAt = undefined;
      }
      user.mobile = trimmedMobile;
    }
  }

  // 2. Language validation (if provided)
  if (preferredLanguage !== undefined) {
    const allowedLanguages = ['en', 'hi', 'mr'];
    if (!allowedLanguages.includes(preferredLanguage)) {
      return next(new AppError('Preferred language must be en, hi, or mr', 400));
    }
    user.preferredLanguage = preferredLanguage;
  }

  // 3. Update basic profile info
  if (fullName !== undefined) {
    user.fullName = fullName.trim();
    // Keep name in sync with fullName for compatibility
    user.name = fullName.trim();
  }
  if (profilePhoto !== undefined) {
    user.profilePhoto = profilePhoto;
    const publicIdInfo = getPublicIdFromUrl(profilePhoto);
    if (publicIdInfo) {
      user.profilePhotoPublicId = publicIdInfo.publicId;
    }
  }
  if (village !== undefined) user.village = village.trim();
  if (taluka !== undefined) user.taluka = taluka.trim();
  if (district !== undefined) user.district = district.trim();
  if (state !== undefined) user.state = state.trim();

  // 4. Update Profile Completed flag
  // Profile is complete if all standard contact and address information is filled out
  user.isProfileCompleted = !!(
    user.fullName &&
    user.mobile &&
    user.village &&
    user.taluka &&
    user.district &&
    user.state
  );

  await user.save();

  try {
    await Notification.create({
      recipient: user._id,
      title: 'प्रोफाइल अद्ययावत केली / Profile Updated',
      message: 'तुमची प्रोफाईल माहिती यशस्वीरित्या अद्ययावत केली गेली आहे. / Your profile information has been updated successfully.',
      type: 'info',
      targetScreen: 'Profile'
    });
  } catch (notifErr) {
    console.error('[NOTIFICATION ERROR] Profile update notification failed:', notifErr.message);
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

/**
 * Upload Profile Photo - POST /api/profile/upload-photo
 */
exports.uploadPhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please upload an image file', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User profile not found', 404));
  }

  // Get resolved storage URL
  const photoUrl = await getUploadedFileUrl(req.file);
  const publicIdInfo = getPublicIdFromUrl(photoUrl);
  const publicId = publicIdInfo ? publicIdInfo.publicId : req.file.filename;
  const oldPhotoUrl = user.profilePhoto;

  try {
    // Update profilePhoto and profilePhotoPublicId in DB
    user.profilePhoto = photoUrl;
    user.profilePhotoPublicId = publicId;
    await user.save();
    console.log(`[PROFILE UPLOAD SUCCESS] Profile photo updated: ${photoUrl}, publicId: ${publicId}`);
  } catch (err) {
    console.error('[MONGO ERROR] Failed to save User profile photo:', err.message);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        console.log(`[CLOUDINARY ROLLBACK SUCCESS] Deleted profile photo after DB error: ${publicId}`);
      } catch (destroyErr) {
        console.error('[CLOUDINARY ROLLBACK ERROR] Failed to destroy profile photo:', destroyErr.message);
      }
    }
    return next(new AppError('Failed to update profile photo in database', 500));
  }

  // Delete old photo if it exists and is a Cloudinary URL
  if (oldPhotoUrl && oldPhotoUrl !== photoUrl) {
    await deleteFromCloudinary(oldPhotoUrl);
    console.log(`[PROFILE REPLACE SUCCESS] Removed old profile photo: ${oldPhotoUrl}`);
  }

  res.status(200).json({
    status: 'success',
    message: 'Profile photo uploaded successfully',
    data: {
      profilePhoto: photoUrl,
      profilePhotoPublicId: publicId,
      user
    }
  });
});

/**
 * Delete User Account - DELETE /api/profile
 */
exports.deleteProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User profile not found', 404));
  }

  // 1. Delete profile photo from Cloudinary if it exists
  if (user.profilePhoto) {
    await deleteFromCloudinary(user.profilePhoto);
    console.log(`[PROFILE DELETE SUCCESS] Deleted Cloudinary profile photo: ${user.profilePhoto}`);
  }

  // 2. Delete verification receipt from Cloudinary if it exists
  const receiptUrl = user.verification && (user.verification.receiptImage || user.verification.receiptUrl);
  if (receiptUrl) {
    await deleteFromCloudinary(receiptUrl);
    console.log(`[VERIFICATION DELETE SUCCESS] Deleted Cloudinary verification receipt: ${receiptUrl}`);
  }

  // 3. Delete user record from MongoDB
  await User.findByIdAndDelete(req.user.id);
  console.log(`[USER DELETE SUCCESS] Removed user record from DB: ${req.user.id}`);

  res.status(200).json({
    status: 'success',
    message: 'User account and associated Cloudinary media deleted successfully'
  });
});
