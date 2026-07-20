const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all complaint routes (must be logged in)
router.use(protect);

// Mobile user route
router.post('/', complaintController.submitComplaint);

// Admin only routes
router.use(restrictTo('admin', 'super-admin'));

router.route('/')
  .get(complaintController.getAllComplaints);

router.route('/:id/status')
  .patch(complaintController.updateComplaintStatus);

router.route('/:id')
  .delete(complaintController.deleteComplaint);

module.exports = router;
