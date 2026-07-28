const express = require('express');
const masterController = require('../controllers/masterController');

const router = express.Router();

// Public routes for Categories
router.get('/categories', masterController.getCategories);
router.get('/categories/:id', masterController.getCategoryById);

// Public routes for Breeds
router.get('/breeds', masterController.getBreeds);

// Public routes for Location dropdowns
router.get('/locations', masterController.getLocations);
router.get('/states', masterController.getStates);
router.get('/districts', masterController.getDistricts);
router.get('/talukas', masterController.getTalukas);
router.get('/villages', masterController.getVillages);

module.exports = router;
