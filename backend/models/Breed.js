const mongoose = require('mongoose');

const breedSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Breed must belong to a category'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide a breed name'],
      trim: true
    },
    description: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compounded index to prevent duplicate breeds within the same category
breedSchema.index({ categoryId: 1, name: 1 }, { unique: true });

const Breed = mongoose.model('Breed', breedSchema);

module.exports = Breed;
