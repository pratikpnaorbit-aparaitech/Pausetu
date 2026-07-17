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
      allowedFileTypes: ['jpeg', 'jpg', 'png', 'webp', 'pdf'],
      marketPriceGlobalUnlock: false,
      feedPlannerGlobalUnlock: false
    });
  }
  return settings;
};

const notifyAdmins = async (title, message, type = 'info') => {
  try {
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        recipient: admin._id,
        title,
        message,
        type
      });
    }
  } catch (err) {
    console.warn('Failed to notify admins:', err.message);
  }
};

/**
 * Submit Milk Dairy Receipt for verification
 */
exports.submitVerification = asyncHandler(async (req, res, next) => {
  const { receiptUrl, farmerName, dairyName, receiptDate } = req.body;

  if (!receiptUrl) {
    return next(new AppError('Please provide a receipt URL', 400));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // ── Profile field validation ──────────────────────────────────────────────
  // Only require the fields the app actually collects (fullName + mobile).
  // village/taluka/district/state are optional address fields not shown in UI.
  const missingFields = [];
  if (!user.fullName || !user.fullName.trim()) missingFields.push('fullName');
  if (!user.mobile  || !user.mobile.trim())   missingFields.push('mobile');

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Please complete your profile before submitting verification',
      missingFields
    });
  }

  const settings = await getSettingsHelper();
  const isAuto = settings.verificationMode === 'auto';

  user.verification = {
    status: isAuto ? 'approved' : 'pending',
    receiptUrl,
    farmerName,
    dairyName,
    receiptDate: receiptDate ? new Date(receiptDate) : undefined,
    submittedAt: new Date(),
    approvedAt: isAuto ? new Date() : undefined,
    rejectedReason: undefined
  };

  await user.save();

  if (isAuto) {
    await Notification.create([
      {
        recipient: user._id,
        title: 'डेअरी पावती पडताळणी यशस्वी / Verification Approved',
        message: 'अभिनंदन! तुमची दुग्धशाळा पावती यशस्वीरित्या मंजूर झाली आहे. आता तुम्ही सर्व वैशिष्ट्ये वापरू शकता. / Congratulations! Your dairy receipt has been approved. You can now use all features.',
        type: 'success'
      },
      {
        recipient: user._id,
        title: 'सदस्यत्व सक्रिय झाले / Membership Activated',
        message: 'तुमचे सत्यापित सदस्यत्व यशस्वीरित्या सक्रिय झाले आहे. / Your verified membership has been successfully activated.',
        type: 'success'
      }
    ]);

    await notifyAdmins(
      'पडताळणी पूर्ण झाली / Verification Completed',
      `वापरकर्ता ${user.fullName || user.name} ची पावती स्वयंचलितपणे मंजूर झाली. / User ${user.fullName || user.name}'s receipt was approved automatically.`,
      'success'
    );
  } else {
    await Notification.create({
      recipient: user._id,
      title: 'पडताळणी सबमिट केली / Verification Submitted',
      message: 'तुमची दुग्धशाळा पावती यशस्वीरित्या सबमिट केली आहे. पडताळणी प्रलंबित आहे. / Your dairy receipt has been submitted. Review is pending.',
      type: 'info'
    });

    await notifyAdmins(
      'नवीन पडताळणी विनंती / New Verification Request',
      `वापरकर्ता ${user.fullName || user.name} ने नवीन पावती सबमिट केली आहे. / User ${user.fullName || user.name} has submitted a new receipt.`,
      'info'
    );

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
 * Confirm receipt URL after upload.
 * OCR extraction has been removed. The admin will review the uploaded image manually.
 * Endpoint: POST /api/verification/extract
 * Body: { receiptUrl: "/uploads/filename.jpg" }
 */
exports.extractReceiptDetails = asyncHandler(async (req, res, next) => {
  const { receiptUrl } = req.body;

  if (!receiptUrl) {
    return next(new AppError('Please provide a receipt URL', 400));
  }

  res.status(200).json({
    status: 'success',
    data: {
      receiptUrl
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
    
    notificationTitle = 'डेअरी पावती पडताळणी यशस्वी / Verification Approved';
    notificationMessage = 'अभिनंदन! तुमची दुग्धशाळा पावती यशस्वीरित्या मंजूर झाली आहे. आता तुम्ही सर्व वैशिष्ट्ये वापरू शकता. / Congratulations! Your dairy receipt has been approved. You can now use all features.';
    notificationType = 'success';

    await Notification.create({
      recipient: user._id,
      title: 'सदस्यत्व सक्रिय झाले / Membership Activated',
      message: 'तुमचे सत्यापित सदस्यत्व यशस्वीरित्या सक्रिय झाले आहे. / Your verified membership has been successfully activated.',
      type: 'success'
    });
  } else if (status === 'rejected') {
    user.verification.rejectedReason = rejectedReason;
    user.verification.approvedAt = undefined;
    
    notificationTitle = 'डेअरी पावती पडताळणी नाकारली / Verification Rejected';
    notificationMessage = `दिलगीर आहोत, तुमची दुग्धशाळा पावती नाकारण्यात आली आहे. कारण: ${rejectedReason}. कृपया पुन्हा प्रयत्न करा. / Sorry, your dairy receipt was rejected. Reason: ${rejectedReason}. Please try again.`;
    notificationType = 'alert';

    await Notification.create({
      recipient: user._id,
      title: 'पुन्हा अपलोड करणे आवश्यक आहे / Re-upload Required',
      message: 'कृपया वैध पावती दस्तऐवज पुन्हा अपलोड करा. / Please re-upload a valid receipt document.',
      type: 'alert'
    });
  }

  await user.save();

  await Notification.create({
    recipient: user._id,
    title: notificationTitle,
    message: notificationMessage,
    type: notificationType
  });

  await notifyAdmins(
    'पडताळणी पूर्ण झाली / Verification Completed',
    `वापरकर्ता ${user.fullName || user.name} ची पडताळणी स्थिती ${status === 'approved' ? 'मंजूर' : 'नाकारली'} केली आहे. / User ${user.fullName || user.name}'s status was updated to ${status}.`,
    status === 'approved' ? 'success' : 'alert'
  );

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
  const { verificationMode, maxUploadSize, allowedFileTypes, marketPriceGlobalUnlock, feedPlannerGlobalUnlock } = req.body;

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

  if (marketPriceGlobalUnlock !== undefined) {
    settings.marketPriceGlobalUnlock = !!marketPriceGlobalUnlock;
  }

  if (feedPlannerGlobalUnlock !== undefined) {
    settings.feedPlannerGlobalUnlock = !!feedPlannerGlobalUnlock;
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

/**
 * Get pending verification count (Admin only)
 */
exports.getPendingVerificationsCount = asyncHandler(async (req, res, next) => {
  const count = await User.countDocuments({ 'verification.status': 'pending' });

  res.status(200).json({
    status: 'success',
    data: {
      pendingVerificationCount: count
    }
  });
});
