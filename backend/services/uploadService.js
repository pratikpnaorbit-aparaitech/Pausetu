const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('../middleware/errorHandler');

// Ensure local uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique name: user-id + timestamp + original-extension
    const userId = req.user ? req.user.id : 'anonymous';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Multer File Filter - Image validation (jpg, jpeg, png, webp)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|mp4|mov|avi|mkv/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype || extname) {
    return cb(null, true);
  }
  cb(new AppError('Only images (JPEG, JPG, PNG, WEBP) and videos (MP4, MOV, AVI, MKV) are allowed!', 400), false);
};

// Configurable upload middleware (Max 5MB file size)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

/**
 * Service to process the upload output and return the appropriate URL.
 * Designed to support swappable storage providers.
 * @param {Object} file - The file object from Multer
 * @returns {String} Resolved storage URL
 */
const getUploadedFileUrl = async (file) => {
  const provider = process.env.STORAGE_PROVIDER || 'local';

  if (provider === 'cloudinary') {
    // Future Cloudinary integration placeholder
    // const result = await cloudinary.uploader.upload(file.path);
    // return result.secure_url;
    console.log('[UPLOAD SERVICE] Cloudinary provider is configured but mocked for now.');
    return `https://res.cloudinary.com/demo/image/upload/mocked-${file.filename}`;
  }

  // Local Storage URL Path
  // In production, configure app.use('/uploads', express.static('uploads'))
  return `/uploads/${file.filename}`;
};

module.exports = {
  upload,
  getUploadedFileUrl
};
