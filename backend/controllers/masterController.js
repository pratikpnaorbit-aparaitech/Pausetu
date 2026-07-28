const Category = require('../models/Category');
const Breed = require('../models/Breed');
const { State, District, Taluka, Village } = require('../models/Location');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper to build pagination and search query result wrapper
 * @param {Object} req - Express request
 * @param {Object} model - Mongoose model
 * @param {Object} filter - Initial filter object
 * @param {Object} searchQuery - Mongoose search sub-query
 * @param {String} selectFields - Space separated fields to return
 * @param {Object} sortOptions - Sort object
 */
const getPaginatedResults = async (req, model, filter = {}, searchQuery = {}, selectFields = '', sortOptions = { createdAt: 1 }) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 100; // default 100 records for master lists
  const skip = (page - 1) * limit;

  // Combine initial filters (like isActive) with search query if any search term is provided
  const search = req.query.search || req.query.q || '';
  let finalFilter = { ...filter };
  
  if (search.trim() !== '') {
    finalFilter = { ...finalFilter, ...searchQuery };
  }

  const totalCount = await model.countDocuments(finalFilter);
  const totalPages = Math.ceil(totalCount / limit);

  const query = model.find(finalFilter)
    .select(selectFields)
    .sort(sortOptions)
    .skip(skip)
    .limit(limit);

  const results = await query;

  return {
    results,
    pagination: {
      totalCount,
      totalPages,
      currentPage: page,
      limit
    }
  };
};

// ==========================================
// 1. Category Controller Methods
// ==========================================

/**
 * Get Categories - GET /api/categories
 */
exports.getCategories = asyncHandler(async (req, res, next) => {
  const filter = { isActive: true };
  const search = req.query.search || req.query.q || '';
  const searchQuery = { name: { $regex: search, $options: 'i' } };

  const { results, pagination } = await getPaginatedResults(
    req,
    Category,
    filter,
    searchQuery,
    '',
    { sortOrder: 1, name: 1 }
  );

  res.status(200).json({
    status: 'success',
    pagination,
    data: {
      categories: results
    }
  });
});

/**
 * Get Category by ID - GET /api/categories/:id
 */
exports.getCategoryById = asyncHandler(async (req, res, next) => {
  const category = await Category.findOne({ _id: req.params.id, isActive: true });

  if (!category) {
    return next(new AppError('Category not found or inactive', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      category
    }
  });
});

// ==========================================
// 2. Breed Controller Methods
// ==========================================

/**
 * Get Breeds - GET /api/breeds
 */
exports.getBreeds = asyncHandler(async (req, res, next) => {
  const filter = { isActive: true };

  // Filter by category if categoryId query parameter is provided
  if (req.query.categoryId) {
    filter.categoryId = req.query.categoryId;
  }

  const search = req.query.search || req.query.q || '';
  const searchQuery = { name: { $regex: search, $options: 'i' } };

  const { results, pagination } = await getPaginatedResults(
    req,
    Breed,
    filter,
    searchQuery,
    '',
    { name: 1 }
  );

  res.status(200).json({
    status: 'success',
    pagination,
    data: {
      breeds: results
    }
  });
});

// ==========================================
// 3. Location Controller Methods
// ==========================================

/**
 * Get States - GET /api/states
 */
exports.getStates = asyncHandler(async (req, res, next) => {
  const filter = { isActive: true };
  const search = req.query.search || req.query.q || '';
  const searchQuery = { name: { $regex: search, $options: 'i' } };

  const { results, pagination } = await getPaginatedResults(
    req,
    State,
    filter,
    searchQuery,
    '',
    { name: 1 }
  );

  res.status(200).json({
    status: 'success',
    pagination,
    data: {
      states: results
    }
  });
});

/**
 * Get Districts - GET /api/districts
 */
exports.getDistricts = asyncHandler(async (req, res, next) => {
  const filter = { isActive: true };

  // Enforce dependent dropdown filtering by stateId
  if (req.query.stateId) {
    filter.stateId = req.query.stateId;
  }

  const search = req.query.search || req.query.q || '';
  const searchQuery = { name: { $regex: search, $options: 'i' } };

  const { results, pagination } = await getPaginatedResults(
    req,
    District,
    filter,
    searchQuery,
    '',
    { name: 1 }
  );

  res.status(200).json({
    status: 'success',
    pagination,
    data: {
      districts: results
    }
  });
});

/**
 * Get Talukas - GET /api/talukas
 */
exports.getTalukas = asyncHandler(async (req, res, next) => {
  const filter = { isActive: true };

  // Enforce dependent dropdown filtering by districtId
  if (req.query.districtId) {
    filter.districtId = req.query.districtId;
  }

  const search = req.query.search || req.query.q || '';
  const searchQuery = { name: { $regex: search, $options: 'i' } };

  const { results, pagination } = await getPaginatedResults(
    req,
    Taluka,
    filter,
    searchQuery,
    '',
    { name: 1 }
  );

  res.status(200).json({
    status: 'success',
    pagination,
    data: {
      talukas: results
    }
  });
});

/**
 * Get Villages - GET /api/villages
 */
exports.getVillages = asyncHandler(async (req, res, next) => {
  const filter = { isActive: true };

  // Enforce dependent dropdown filtering by talukaId
  if (req.query.talukaId) {
    filter.talukaId = req.query.talukaId;
  }

  const search = req.query.search || req.query.q || '';
  const searchQuery = { name: { $regex: search, $options: 'i' } };

  const { results, pagination } = await getPaginatedResults(
    req,
    Village,
    filter,
    searchQuery,
    '',
    { name: 1 }
  );

  res.status(200).json({
    status: 'success',
    pagination,
    data: {
      villages: results
    }
  });
});

/**
 * Get Locations - GET /api/locations
 */
exports.getLocations = asyncHandler(async (req, res, next) => {
  const districts = await District.find({ isActive: true }).sort({ name: 1 });
  const states = await State.find({ isActive: true }).sort({ name: 1 });

  res.status(200).json({
    status: 'success',
    data: {
      districts,
      states,
      locations: districts
    }
  });
});
