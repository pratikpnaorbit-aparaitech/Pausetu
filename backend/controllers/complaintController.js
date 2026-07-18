const Complaint = require('../models/Complaint');
const Animal = require('../models/Animal');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// Submit a new complaint
exports.submitComplaint = asyncHandler(async (req, res, next) => {
  const { animalId, message } = req.body;
  const reporterId = req.user.id;

  if (!animalId || !message) {
    return next(new AppError('Animal ID and message are required', 400));
  }

  if (message.length < 10 || message.length > 500) {
    return next(new AppError('Complaint message must be between 10 and 500 characters', 400));
  }

  const animal = await Animal.findById(animalId);
  if (!animal) {
    return next(new AppError('Animal listing not found', 404));
  }

  // Prevent duplicate pending complaints
  const existingComplaint = await Complaint.findOne({
    animalId,
    reporterId,
    status: 'pending'
  });

  if (existingComplaint) {
    return next(new AppError('You have already reported this listing', 400));
  }

  const complaint = await Complaint.create({
    animalId,
    reporterId,
    sellerId: animal.sellerId,
    message,
    status: 'pending'
  });

  res.status(201).json({
    status: 'success',
    data: complaint
  });
});

// Admin: Get all complaints
exports.getAllComplaints = asyncHandler(async (req, res, next) => {
  const filter = {};
  
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const complaints = await Complaint.find(filter)
    .populate('animalId', 'title photos price status')
    .populate('reporterId', 'name mobile role')
    .populate('sellerId', 'name mobile role')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: complaints.length,
    data: complaints
  });
});

// Admin: Update complaint status
exports.updateComplaintStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  
  if (!['pending', 'resolved'].includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: complaint
  });
});

// Admin: Delete complaint
exports.deleteComplaint = asyncHandler(async (req, res, next) => {
  const complaint = await Complaint.findByIdAndDelete(req.params.id);

  if (!complaint) {
    return next(new AppError('Complaint not found', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
