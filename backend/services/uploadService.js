const multer = require('multer');
const path = require('path');
const { AppError } = require('../middleware/errorHandler');
const { storage } = require('../config/cloudinary');

// Multer File Filter - Image & Video validation (jpg, jpeg, png, webp, pdf, mp4, mov, webm)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|pdf|mp4|mov|webm/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) {
    return cb(null, true);
  }
  cb(new AppError('Only JPEG, JPG, PNG, WEBP, PDF, MP4, MOV, and WEBM formats are allowed!', 400), false);
};

// Configurable upload middleware (Max 100MB file size)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * Service to process the upload output and return the appropriate URL.
 * @param {Object} file - The file object from Multer
 * @returns {String} Resolved storage URL
 */
const getUploadedFileUrl = async (file) => {
  if (file.path && (file.path.startsWith('http://') || file.path.startsWith('https://'))) {
    return file.path;
  }
  if (file.secure_url) {
    return file.secure_url;
  }
  return `/uploads/${file.filename}`;
};

module.exports = {
  upload,
  getUploadedFileUrl
};
