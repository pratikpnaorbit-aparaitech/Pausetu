const express = require('express');
const profileController = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../services/uploadService');

const router = express.Router();

// Protect all profile routes
router.use(protect);

router
  .route('/')
  .get(profileController.getProfile)
  .put(profileController.updateProfile);

router.post('/upload-photo', upload.single('photo'), profileController.uploadPhoto);

module.exports = router;
