const mongoose = require('mongoose');

const buyerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer profile must be linked to a User'],
      unique: true
    },
    preferences: {
      preferredCategories: [String],
      maxBudget: Number
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Animal'
      }
    ],
    searchHistory: [String]
  },
  {
    timestamps: true
  }
);

const Buyer = mongoose.model('Buyer', buyerSchema);

module.exports = Buyer;
