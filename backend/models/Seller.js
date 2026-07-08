const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller profile must be linked to a User'],
      unique: true
    },
    businessName: String,
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    rating: {
      type: Number,
      default: 5.0
    },
    listedAnimals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal'
      }
    ],
    verifiedDocuments: [String]
  },
  {
    timestamps: true
  }
);

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;
