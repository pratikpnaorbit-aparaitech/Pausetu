const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { getUploadedFileUrl } = require('../services/uploadService');

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
  if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
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

  // Get resolved storage URL (local directory path or mock Cloudinary)
  const photoUrl = await getUploadedFileUrl(req.file);

  // Update profilePhoto in DB
  user.profilePhoto = photoUrl;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Profile photo uploaded successfully',
    data: {
      profilePhoto: photoUrl
    }
  });
});
