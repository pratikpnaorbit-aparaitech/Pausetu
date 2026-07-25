const Animal = require('../models/Animal');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { verifyToken } = require('../utils/jwt');
const { getPublicIdFromUrl, deleteFromCloudinary } = require('../config/cloudinary');

/**
 * Get all animal listings - GET /api/animals
 * Supports search, filtering, and pagination. Excludes soft-deleted records.
 */
exports.getAllAnimals = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Optionally decode token to check if user is admin or the owner
  if (req.headers.authorization && req.headers.authorization.toLowerCase().startsWith('bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      req.user = verifyToken(token);
    } catch (e) {
      // Ignore invalid tokens for public feed
    }
  }

  // Build filters
  const filter = { isDeleted: false };

  // Validate status filtering permissions:
  // Non-approved statuses (pending, rejected, draft, etc.) can only be accessed by:
  // 1. Admin users (globally or per seller)
  // 2. The seller themselves (only for their own listings)
  const isReqAdmin = req.user && req.user.role === 'admin';
  const isReqOwner = req.user && req.query.sellerId && req.user.id === req.query.sellerId;
  const isAuthorizedForPrivateStatus = isReqAdmin || isReqOwner;

  if (req.query.sellerId) {
    filter.sellerId = req.query.sellerId;
    
    if (req.query.status) {
      if (req.query.status === 'approved' || isAuthorizedForPrivateStatus) {
        filter.status = req.query.status;
      } else {
        filter.status = 'approved';
      }
    } else {
      if (!isAuthorizedForPrivateStatus) {
        filter.status = 'approved';
      }
    }
  } else {
    if (req.query.status) {
      if (req.query.status === 'approved' || isReqAdmin) {
        filter.status = req.query.status;
      } else {
        filter.status = 'approved';
      }
    } else {
      if (!isReqAdmin) {
        filter.status = 'approved';
      }
    }
  }

  // Category and Breed filters
  if (req.query.categoryId) filter.categoryId = req.query.categoryId;
  if (req.query.breedId) filter.breedId = req.query.breedId;

  // Location filters
  if (req.query.state) filter.state = req.query.state;
  if (req.query.district) filter.district = req.query.district;
  if (req.query.taluka) filter.taluka = req.query.taluka;
  if (req.query.village) filter.village = req.query.village;

  // Price range filters
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  // Search filter
  const search = req.query.search || req.query.q || '';
  if (search.trim() !== '') {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const totalCount = await Animal.countDocuments(filter);
  const totalPages = Math.ceil(totalCount / limit);

  const animals = await Animal.find(filter)
    .populate('sellerId', 'name email mobile')
    .populate('categoryId', 'name slug')
    .populate('breedId', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Filter out animals whose main photo doesn't exist on disk to prevent 404 rendering errors
  const fs = require('fs');
  const path = require('path');
  const isRemoteUrl = (url) => typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
  const photoExists = (p) => {
    if (!p) return false;
    if (isRemoteUrl(p)) return true;
    const pPath = path.join(__dirname, '..', p.startsWith('/') ? p.substring(1) : p);
    return fs.existsSync(pPath);
  };
  const validAnimals = [];
  for (const animal of animals) {
    if (animal.photos && animal.photos[0]) {
      if (photoExists(animal.photos[0])) {
        // Also clean up any other missing photos from the array
        animal.photos = animal.photos.filter(photoExists);
        validAnimals.push(animal);
      }
    } else {
      validAnimals.push(animal);
    }
  }

  res.status(200).json({
    status: 'success',
    pagination: {
      totalCount: validAnimals.length, // Sync totalCount with filtered count
      totalPages,
      currentPage: page,
      limit
    },
    data: {
      animals: validAnimals
    }
  });
});

/**
 * Get animal by ID - GET /api/animals/:id
 * Automatically increments the view counter
 */
exports.getAnimal = asyncHandler(async (req, res, next) => {
  // Find animal and increment views by 1
  const animal = await Animal.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('sellerId', 'name email mobile profilePhoto')
    .populate('categoryId', 'name slug')
    .populate('breedId', 'name');

  if (!animal) {
    return next(new AppError('Animal listing not found', 404));
  }

  // Filter out any missing photos from disk
  const fs = require('fs');
  const path = require('path');
  if (animal.photos) {
    animal.photos = animal.photos.filter(p => {
      if (!p) return false;
      if (typeof p === 'string' && (p.startsWith('http://') || p.startsWith('https://'))) return true;
      const pPath = path.join(__dirname, '..', p.startsWith('/') ? p.substring(1) : p);
      return fs.existsSync(pPath);
    });
  }

  // Clear local profilePhoto reference if missing (preserve Cloudinary remote URLs)
  if (animal.sellerId && animal.sellerId.profilePhoto && typeof animal.sellerId.profilePhoto === 'string' && !animal.sellerId.profilePhoto.startsWith('http://') && !animal.sellerId.profilePhoto.startsWith('https://')) {
    const spPath = path.join(__dirname, '..', animal.sellerId.profilePhoto.startsWith('/') ? animal.sellerId.profilePhoto.substring(1) : animal.sellerId.profilePhoto);
    if (!fs.existsSync(spPath)) {
      animal.sellerId.profilePhoto = null;
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      animal
    }
  });
});

/**
 * Create animal listing - POST /api/animals
 * Enforces mandatory listing constraints
 */
exports.createAnimal = asyncHandler(async (req, res, next) => {
  const {
    categoryId,
    breedId,
    title,
    description,
    price,
    negotiable,
    photos,
    video,
    gender,
    age,
    weight,
    color,
    health,
    state,
    district,
    taluka,
    village,
    pincode,
    formattedAddress,
    latitude,
    longitude,
    mediaMetadata
  } = req.body;

  // 1. Enforce validation checks

  if (!categoryId || !breedId || !title || !price || !state || !district || !taluka || !village) {
    return next(new AppError('Please fill out all required fields (Category, Breed, Title, Price, Location).', 400));
  }

  if (!photos || !Array.isArray(photos) || photos.length < 5) {
    return next(new AppError('Minimum of 5 photos are mandatory to list an animal.', 400));
  }

  if (photos.length > 10) {
    return next(new AppError('Maximum of 10 photos can be listed.', 400));
  }

  if (!video) {
    return next(new AppError('A live video recording is mandatory to list an animal.', 400));
  }

  // Extract public IDs from Cloudinary URLs
  const photoPublicIds = (photos || []).map(p => {
    const result = getPublicIdFromUrl(p);
    return result ? result.publicId : null;
  }).filter(id => !!id);

  const videoResult = getPublicIdFromUrl(video);
  const videoPublicId = videoResult ? videoResult.publicId : null;

  // 2. Build and save the animal listing (sets status default to 'pending')
  const animal = await Animal.create({
    sellerId: req.user.id,
    categoryId,
    breedId,
    title,
    description,
    price: Number(price),
    negotiable: negotiable === true || negotiable === 'true',
    photos,
    photoPublicIds,
    video,
    videoPublicId,
    gender: gender || 'Female',
    age,
    weight,
    color,
    health: health || {},
    state,
    district,
    taluka,
    village,
    pincode,
    formattedAddress,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    status: 'pending', // Default listing status
    mediaMetadata: mediaMetadata || {}
  });

  try {
    await Notification.create({
      recipient: req.user.id,
      title: 'जाहिरात सबमिट केली / Listing Submitted',
      message: `तुमची जाहिरात "${animal.title}" यशस्वीरित्या सबमिट केली आहे आणि तपासणीसाठी प्रलंबित आहे. / Your listing "${animal.title}" has been submitted and is pending approval.`,
      type: 'info',
      relatedId: animal._id.toString(),
      targetScreen: 'MyListings'
    });
  } catch (notifErr) {
    console.error('[NOTIFICATION ERROR] Failed to create submission notification:', notifErr.message);
  }

  res.status(201).json({
    status: 'success',
    message: 'Animal listing submitted successfully and is pending admin approval',
    data: {
      animal
    }
  });
});

/**
 * Update animal listing - PUT/PATCH /api/animals/:id
 */
exports.updateAnimal = asyncHandler(async (req, res, next) => {
  let animal = await Animal.findOne({ _id: req.params.id, isDeleted: false });

  if (!animal) {
    return next(new AppError('Animal listing not found', 404));
  }

  // Check ownership
  if (animal.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this listing', 403));
  }

  // Prevent editing price, title, category, breed etc. if status is sold/deleted?
  // We can let them edit if status is pending/approved/draft
  const updateData = { ...req.body };
  delete updateData.sellerId; // Prevent changing ownership
  delete updateData.views;    // Prevent changing views counter

  // If status is updated to approved/rejected, only admins can do it
  if (updateData.status && updateData.status !== animal.status) {
    if (req.user.role !== 'admin') {
      // Sellers can only mark their animals as 'sold' or 'draft'
      if (!['sold', 'draft'].includes(updateData.status)) {
        return next(new AppError('Only admins can approve or reject listings', 403));
      }
    } else {
      // Admin actions
      updateData.approvedBy = req.user.id;
      updateData.approvedAt = new Date();
    }
  }

  // Cloudinary media cleanup for replaced assets
  try {
    if (updateData.photos && Array.isArray(updateData.photos)) {
      const oldPhotos = animal.photos || [];
      const newPhotos = updateData.photos;
      
      const removedPhotos = oldPhotos.filter(p => !newPhotos.includes(p));
      for (const photoUrl of removedPhotos) {
        await deleteFromCloudinary(photoUrl);
        console.log(`[MEDIA REPLACE SUCCESS] Deleted photo: ${photoUrl}`);
      }

      updateData.photoPublicIds = newPhotos.map(p => {
        const result = getPublicIdFromUrl(p);
        return result ? result.publicId : null;
      }).filter(id => !!id);
    }

    if (updateData.video && updateData.video !== animal.video) {
      if (animal.video) {
        await deleteFromCloudinary(animal.video);
        console.log(`[MEDIA REPLACE SUCCESS] Deleted video: ${animal.video}`);
      }
      const result = getPublicIdFromUrl(updateData.video);
      updateData.videoPublicId = result ? result.publicId : null;
    }
  } catch (mediaErr) {
    console.error('[MEDIA CLEANUP ERROR] Replaced assets delete failed:', mediaErr.message);
    return next(new AppError('Failed to process media replacement updates', 500));
  }

  animal = await Animal.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    message: 'Animal listing updated successfully',
    data: {
      animal
    }
  });
});

/**
 * Soft Delete animal listing - DELETE /api/animals/:id
 */
exports.deleteAnimal = asyncHandler(async (req, res, next) => {
  const animal = await Animal.findOne({ _id: req.params.id, isDeleted: false });

  if (!animal) {
    return next(new AppError('Animal listing not found', 404));
  }

  // Check ownership
  if (animal.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this listing', 403));
  }

  // Delete all Cloudinary assets
  try {
    if (animal.photos && Array.isArray(animal.photos)) {
      for (const photoUrl of animal.photos) {
        await deleteFromCloudinary(photoUrl);
      }
    }
    if (animal.video) {
      await deleteFromCloudinary(animal.video);
    }
    console.log(`[DELETE SUCCESS] Cloudinary assets deleted for animal: ${req.params.id}`);
  } catch (err) {
    console.error('[MEDIA DELETE ERROR] Failed to destroy Cloudinary assets:', err.message);
  }

  // Hard delete animal from database
  await Animal.deleteOne({ _id: req.params.id });
  console.log(`[DELETE SUCCESS] Animal listing removed from DB: ${req.params.id}`);

  res.status(200).json({
    status: 'success',
    message: 'Animal listing deleted successfully'
  });
});

/**
 * Approve animal listing - PATCH /api/animals/:id/approve
 * Admin-only: sets status to approved and records who approved it
 */
exports.approveListing = asyncHandler(async (req, res, next) => {
  const animal = await Animal.findOne({ _id: req.params.id, isDeleted: false });

  if (!animal) {
    return next(new AppError('Animal listing not found', 404));
  }

  if (animal.status === 'approved') {
    return next(new AppError('This listing is already approved', 400));
  }

  animal.status = 'approved';
  animal.approvedBy = req.user.id;
  animal.approvedAt = new Date();
  animal.rejectionReason = undefined;
  await animal.save();

  try {
    await Notification.create({
      recipient: animal.sellerId,
      title: 'जाहिरात मंजूर झाली / Listing Approved',
      message: `अभिनंदन! तुमची जाहिरात "${animal.title}" प्रशासकाद्वारे मंजूर झाली आहे. / Congratulations! Your listing "${animal.title}" has been approved.`,
      type: 'success',
      relatedId: animal._id.toString(),
      targetScreen: 'AnimalDetails'
    });
  } catch (notifErr) {
    console.error('[NOTIFICATION ERROR] Failed to create approval notification:', notifErr.message);
  }

  const populated = await Animal.findById(animal._id)
    .populate('sellerId', 'name email mobile')
    .populate('categoryId', 'name slug')
    .populate('breedId', 'name');

  res.status(200).json({
    status: 'success',
    message: 'Animal listing approved and is now live on the marketplace',
    data: { animal: populated }
  });
});

/**
 * Reject animal listing - PATCH /api/animals/:id/reject
 * Admin-only: sets status to rejected and stores the mandatory rejection reason
 */
exports.rejectListing = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason || reason.trim() === '') {
    return next(new AppError('A rejection reason is mandatory', 400));
  }

  const animal = await Animal.findOne({ _id: req.params.id, isDeleted: false });

  if (!animal) {
    return next(new AppError('Animal listing not found', 404));
  }

  animal.status = 'rejected';
  animal.rejectionReason = reason.trim();
  animal.approvedBy = undefined;
  animal.approvedAt = undefined;
  await animal.save();

  try {
    await Notification.create({
      recipient: animal.sellerId,
      title: 'जाहिरात नाकारली / Listing Rejected',
      message: `तुमची जाहिरात "${animal.title}" नाकारण्यात आली आहे. कारण: ${reason.trim()}. / Your listing "${animal.title}" was rejected. Reason: ${reason.trim()}.`,
      type: 'alert',
      relatedId: animal._id.toString(),
      targetScreen: 'MyListings'
    });
  } catch (notifErr) {
    console.error('[NOTIFICATION ERROR] Failed to create rejection notification:', notifErr.message);
  }

  const populated = await Animal.findById(animal._id)
    .populate('sellerId', 'name email mobile')
    .populate('categoryId', 'name slug')
    .populate('breedId', 'name');

  res.status(200).json({
    status: 'success',
    message: 'Animal listing has been rejected. The seller will be notified.',
    data: { animal: populated }
  });
});
