const Upload = require('../models/Upload');
const asyncHandler = require('../utils/asyncHandler');
const { getUploadedFileUrl } = require('../services/uploadService');
const { AppError } = require('../middleware/errorHandler');
const { cloudinary } = require('../config/cloudinary');

/**
 * Upload single file
 */
exports.uploadSingle = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please provide a file to upload', 400));
  }

  const fileUrl = await getUploadedFileUrl(req.file);
  const publicId = req.file.filename;

  let uploadRecord;
  try {
    uploadRecord = await Upload.create({
      filename: req.file.filename || req.file.originalname,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      publicId: publicId,
      uploadedBy: req.user.id
    });
    console.log(`[UPLOAD SUCCESS] File uploaded to Cloudinary: ${fileUrl}, publicId: ${publicId}`);
  } catch (err) {
    console.error('[MONGO ERROR] Failed to save Upload record:', err.message);
    if (publicId) {
      const resourceType = req.file.mimetype && req.file.mimetype.startsWith('video') ? 'video' : 'image';
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`[CLOUDINARY ROLLBACK SUCCESS] Deleted asset after DB error: ${publicId}`);
      } catch (destroyErr) {
        console.error('[CLOUDINARY ROLLBACK ERROR] Failed to destroy asset:', destroyErr.message);
      }
    }
    return next(new AppError('Failed to save file details in database', 500));
  }

  res.status(201).json({
    status: 'success',
    message: 'File uploaded successfully',
    data: {
      fileUrl: fileUrl,
      upload: uploadRecord
    }
  });
});

/**
 * Remove file by ID - Placeholder
 */
exports.deleteUpload = asyncHandler(async (req, res, next) => {
  res.status(204).json({
    status: 'success',
    message: 'File removal endpoint placeholder (Not Implemented)',
    data: null
  });
});
