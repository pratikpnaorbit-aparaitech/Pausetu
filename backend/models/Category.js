const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      unique: true,
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Please provide a category slug'],
      unique: true,
      lowercase: true,
      trim: true
    },
    icon: {
      type: String
    },
    image: {
      type: String
    },
    description: {
      type: String
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
