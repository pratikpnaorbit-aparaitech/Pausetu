const express = require('express');
const buyerController = require('../controllers/buyerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/profile')
  .get(buyerController.getBuyerProfile)
  .patch(buyerController.updateBuyerProfile);

router
  .route('/favorites')
  .get(buyerController.getFavorites)
  .post(buyerController.addToFavorites);

module.exports = router;
