const express = require('express');
const animalController = require('../controllers/animalController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(animalController.getAllAnimals)
  .post(protect, animalController.createAnimal);

// Admin-only dedicated approve / reject endpoints (hardened — no generic status patch)
router.patch('/:id/approve', protect, restrictTo('admin'), animalController.approveListing);
router.patch('/:id/reject', protect, restrictTo('admin'), animalController.rejectListing);

router
  .route('/:id')
  .get(animalController.getAnimal)
  .patch(protect, animalController.updateAnimal)
  .delete(protect, animalController.deleteAnimal);

module.exports = router;
