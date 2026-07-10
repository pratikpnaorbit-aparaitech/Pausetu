const express = require('express');
const sellerController = require('../controllers/sellerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router
  .route('/profile')
  .get(sellerController.getSellerProfile)
  .patch(sellerController.updateSellerProfile);

router.get('/animals', sellerController.getSellerAnimals);

module.exports = router;
