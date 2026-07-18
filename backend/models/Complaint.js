const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    animalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Animal',
      required: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      minlength: [10, 'Complaint must be at least 10 characters long'],
      maxlength: [500, 'Complaint cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate pending complaints by the same reporter for the same animal
// We will enforce this manually in the controller as well to provide a clean message.
complaintSchema.index(
  { animalId: 1, reporterId: 1 }, 
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

module.exports = mongoose.model('Complaint', complaintSchema);
