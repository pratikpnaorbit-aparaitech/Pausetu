const Animal = require('../models/Animal');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Get all animal listings - GET /api/animals
 * Supports search, filtering, and pagination. Excludes soft-deleted records.
 */
exports.getAllAnimals = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Build filters
  const filter = { isDeleted: false };

  // Public feeds show approved listings only. Sellers can see their own pending/rejected draft listings.
  if (req.query.sellerId) {
    filter.sellerId = req.query.sellerId;
    if (req.query.status) {
      filter.status = req.query.status;
    }
  } else {
    filter.status = 'approved'; // Default to showing only approved listings to the public
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

  res.status(200).json({
    status: 'success',
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      limit
    },
    data: {
      animals
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
    video,
    gender: gender || 'Female',
    age,
    weight,
    color,
    health: health || {},
    state,
    district,
    taluka,
    village,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
    status: 'pending', // Default listing status
    mediaMetadata: mediaMetadata || {}
  });

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

  animal.isDeleted = true;
  await animal.save();

  res.status(200).json({
    status: 'success',
    message: 'Animal listing deleted successfully'
  });
});
