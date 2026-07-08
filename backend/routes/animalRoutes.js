const express = require('express');
const animalController = require('../controllers/animalController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .get(animalController.getAllAnimals)
  .post(protect, animalController.createAnimal);

router
  .route('/:id')
  .get(animalController.getAnimal)
  .patch(protect, animalController.updateAnimal)
  .delete(protect, animalController.deleteAnimal);

module.exports = router;
