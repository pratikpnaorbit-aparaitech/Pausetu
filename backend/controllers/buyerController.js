const Buyer = require('../models/Buyer');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Get buyer profile - Placeholder
 */
exports.getBuyerProfile = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Get buyer profile endpoint placeholder (Not Implemented)',
    data: null
  });
});

/**
 * Update buyer profile - Placeholder
 */
exports.updateBuyerProfile = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    message: 'Update buyer profile endpoint placeholder (Not Implemented)',
    data: null
  });
});

/**
 * Get buyer's favorite animals
 */
exports.getFavorites = asyncHandler(async (req, res, next) => {
  let buyer = await Buyer.findOne({ user: req.user.id }).populate('favorites');
  
  if (!buyer) {
    buyer = await Buyer.create({ user: req.user.id, favorites: [] });
  }

  res.status(200).json({
    status: 'success',
    data: buyer.favorites
  });
});

/**
 * Toggle an animal in buyer's favorites
 */
exports.addToFavorites = asyncHandler(async (req, res, next) => {
  const { animalId } = req.body;
  
  if (!animalId) {
    return res.status(400).json({
      status: 'fail',
      message: 'Please provide an animalId'
    });
  }

  let buyer = await Buyer.findOne({ user: req.user.id });
  if (!buyer) {
    buyer = await Buyer.create({ user: req.user.id, favorites: [] });
  }

  const isFavorited = buyer.favorites.some(id => id.toString() === animalId.toString());

  if (isFavorited) {
    buyer.favorites.pull(animalId);
  } else {
    buyer.favorites.push(animalId);
  }

  buyer.markModified('favorites');
  await buyer.save();

  res.status(200).json({
    status: 'success',
    isFavorited: !isFavorited,
    data: buyer.favorites
  });
});
