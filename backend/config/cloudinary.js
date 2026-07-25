const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Cloudinary Storage Engine
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'general';
    let resource_type = 'auto'; // automatically identify format
    
    const urlPath = req.originalUrl || req.baseUrl || '';
    
    // Route to appropriate Cloudinary folder based on URL path and mimetype
    if (urlPath.includes('/profile')) {
      folder = 'profiles/users';
      resource_type = 'image';
    } else if (urlPath.includes('/verification')) {
      folder = 'verification/receipts';
      if (file.mimetype === 'application/pdf') {
        resource_type = 'raw';
      } else {
        resource_type = 'image';
      }
    } else if (urlPath.includes('/uploads')) {
      if (file.mimetype.startsWith('video')) {
        folder = 'animals/videos';
        resource_type = 'video';
      } else if (file.mimetype === 'application/pdf') {
        folder = 'verification/receipts';
        resource_type = 'raw';
      } else if (file.originalname && (file.originalname.includes('receipt') || file.originalname.includes('verification'))) {
        folder = 'verification/receipts';
        resource_type = 'image';
      } else {
        folder = 'animals/images';
        resource_type = 'image';
      }
    }

    // Generate unique filename using timestamp and a random number
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const originalNameClean = (file.originalname || 'file')
      .replace(/\.[^/.]+$/, "") // strip extension
      .replace(/[^a-zA-Z0-9-_]/g, "_"); // sanitize characters

    const publicId = `${originalNameClean}_${uniqueSuffix}`;

    const config = {
      folder: folder,
      resource_type: resource_type,
      public_id: publicId
    };

    // Enable automatic optimization for images
    if (resource_type === 'image') {
      config.fetch_format = 'auto';
      config.quality = 'auto';
    }

    return config;
  }
});

/**
 * Extracts publicId and resourceType from a Cloudinary secure URL.
 * Supports nested subdirectories.
 * @param {String} url - Cloudinary asset URL
 * @returns {Object|null} { publicId, resourceType }
 */
const getPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    let startIndex = uploadIndex + 1;
    // Skip version segment if it exists (starts with 'v' followed by digits)
    if (parts[startIndex].startsWith('v') && !isNaN(parts[startIndex].substring(1))) {
      startIndex = uploadIndex + 2;
    }
    
    const publicIdWithExt = parts.slice(startIndex).join('/');
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = lastDotIndex !== -1 ? publicIdWithExt.substring(0, lastDotIndex) : publicIdWithExt;
    
    const resourceType = parts[uploadIndex - 1] || 'image';
    
    return { publicId, resourceType };
  } catch (error) {
    console.error('[CLOUDINARY HELPER] Failed to parse URL:', error.message);
    return null;
  }
};

/**
 * Deletes an asset from Cloudinary. Safe for legacy non-Cloudinary URLs.
 * @param {String} url - Cloudinary secure URL
 * @returns {Promise<void>}
 */
const deleteFromCloudinary = async (url) => {
  const result = getPublicIdFromUrl(url);
  if (!result) {
    console.log(`[CLOUDINARY HELPER] Skipping deletion (Not a Cloudinary URL): ${url}`);
    return;
  }
  
  try {
    const { publicId, resourceType } = result;
    console.log(`[CLOUDINARY HELPER] Deleting asset: ${publicId} of type: ${resourceType}`);
    const deleteResult = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    console.log('[CLOUDINARY HELPER] Delete response:', deleteResult);
  } catch (err) {
    console.error('[CLOUDINARY HELPER] Error deleting asset:', err.message);
  }
};

module.exports = {
  cloudinary,
  storage,
  getPublicIdFromUrl,
  deleteFromCloudinary
};
