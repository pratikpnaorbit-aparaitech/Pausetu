const User = require('../models/User');
const Notification = require('../models/Notification');
const Setting = require('../models/Setting');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

const getSettingsHelper = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      verificationMode: 'manual',
      maxUploadSize: 5,
      allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp', 'pdf']
    });
  }
  return settings;
};

/**
 * Submit Milk Dairy Receipt for verification
 */
exports.submitVerification = asyncHandler(async (req, res, next) => {
  const { receiptUrl } = req.body;

  if (!receiptUrl) {
    return next(new AppError('Please provide a receipt URL', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.isProfileCompleted) {
    return next(new AppError('Please complete your profile before submitting verification', 400));
  }

  const settings = await getSettingsHelper();
  const isAuto = settings.verificationMode === 'auto';

  user.verification = {
    status: isAuto ? 'approved' : 'pending',
    receiptUrl,
    submittedAt: new Date(),
    approvedAt: isAuto ? new Date() : undefined,
    rejectedReason: undefined
  };

  await user.save();

  if (isAuto) {
    await Notification.create({
      recipient: user._id,
      title: 'डेअरी पावती पडताळणी यशस्वी',
      message: 'अभिनंदन! तुमची दुग्धशाळा पावती यशस्वीरित्या मंजूर झाली आहे. आता तुम्ही सर्व वैशिष्ट्ये वापरू शकता.',
      type: 'success'
    });
  }

  res.status(200).json({
    status: 'success',
    message: isAuto ? 'Verification approved automatically' : 'Verification receipt submitted successfully',
    data: {
      verification: user.verification
    }
  });
});

/**
 * Get current user verification status
 */
exports.getVerificationStatus = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      verification: user.verification || { status: 'unverified' }
    }
  });
});

/**
 * Get pending verification requests (Admin only)
 */
exports.getPendingVerifications = asyncHandler(async (req, res, next) => {
  const users = await User.find({ 'verification.status': 'pending' }).sort({ 'verification.submittedAt': 1 });

  res.status(200).json({
    status: 'success',
    data: {
      requests: users
    }
  });
});

/**
 * Get verification requests by status (Admin only)
 */
exports.getVerificationsByStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.query;
  const filter = {};
  if (status) {
    filter['verification.status'] = status;
  } else {
    filter['verification.status'] = { $ne: 'unverified' };
  }

  const users = await User.find(filter).sort({ 'verification.submittedAt': -1 });

  res.status(200).json({
    status: 'success',
    data: {
      requests: users
    }
  });
});

/**
 * Update verification status (Admin only)
 */
exports.updateVerificationStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, rejectedReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Invalid status. Must be approved or rejected', 400));
  }

  if (status === 'rejected' && !rejectedReason) {
    return next(new AppError('Rejection reason is required when status is rejected', 400));
  }

  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.verification.status !== 'pending') {
    return next(new AppError('User verification request is not in pending status', 400));
  }

  user.verification.status = status;
  user.verification.verifiedBy = req.user.id;

  let notificationTitle = '';
  let notificationMessage = '';
  let notificationType = 'info';

  if (status === 'approved') {
    user.verification.approvedAt = new Date();
    user.verification.rejectedReason = undefined;
    
    notificationTitle = 'डेअरी पावती पडताळणी यशस्वी';
    notificationMessage = 'अभिनंदन! तुमची दुग्धशाळा पावती यशस्वीरित्या मंजूर झाली आहे. आता तुम्ही सर्व वैशिष्ट्ये वापरू शकता.';
    notificationType = 'success';
  } else if (status === 'rejected') {
    user.verification.rejectedReason = rejectedReason;
    user.verification.approvedAt = undefined;
    
    notificationTitle = 'डेअरी पावती पडताळणी नाकारली';
    notificationMessage = `दिलगीर आहोत, तुमची दुग्धशाळा पावती नाकारण्यात आली आहे. कारण: ${rejectedReason}. कृपया पुन्हा प्रयत्न करा.`;
    notificationType = 'alert';
  }

  await user.save();

  await Notification.create({
    recipient: user._id,
    title: notificationTitle,
    message: notificationMessage,
    type: notificationType
  });

  res.status(200).json({
    status: 'success',
    message: `Verification status updated to ${status}`,
    data: {
      user
    }
  });
});

/**
 * Get verification settings
 */
exports.getSettings = asyncHandler(async (req, res, next) => {
  const settings = await getSettingsHelper();
  res.status(200).json({
    status: 'success',
    data: {
      settings
    }
  });
});

/**
 * Update verification settings (Admin only)
 */
exports.updateSettings = asyncHandler(async (req, res, next) => {
  const { verificationMode, maxUploadSize, allowedFileTypes } = req.body;

  let settings = await Setting.findOne();
  if (!settings) {
    settings = new Setting();
  }

  if (verificationMode !== undefined) {
    if (!['manual', 'auto', 'ocr_manual'].includes(verificationMode)) {
      return next(new AppError('Invalid verification mode', 400));
    }
    settings.verificationMode = verificationMode;
  }

  if (maxUploadSize !== undefined) {
    const size = Number(maxUploadSize);
    if (isNaN(size) || size <= 0) {
      return next(new AppError('Maximum upload size must be a positive number', 400));
    }
    settings.maxUploadSize = size;
  }

  if (allowedFileTypes !== undefined) {
    if (!Array.isArray(allowedFileTypes)) {
      return next(new AppError('Allowed file types must be an array of strings', 400));
    }
    settings.allowedFileTypes = allowedFileTypes;
  }

  await settings.save();

  res.status(200).json({
    status: 'success',
    message: 'Verification settings updated successfully',
    data: {
      settings
    }
  });
});
