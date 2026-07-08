const express = require('express');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../services/uploadService');

const router = express.Router();

router.use(protect);

router.post('/', upload.single('file'), uploadController.uploadSingle);
router.delete('/:id', uploadController.deleteUpload);

module.exports = router;
