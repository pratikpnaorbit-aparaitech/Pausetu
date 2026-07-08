const Upload = require('../models/Upload');
const asyncHandler = require('../utils/asyncHandler');
const { getUploadedFileUrl } = require('../services/uploadService');
const { AppError } = require('../middleware/errorHandler');

/**
 * Upload single file
 */
exports.uploadSingle = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Please provide a file to upload', 400));
  }

  const fileUrl = await getUploadedFileUrl(req.file);

  const uploadRecord = await Upload.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: fileUrl,
    uploadedBy: req.user.id
  });

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
