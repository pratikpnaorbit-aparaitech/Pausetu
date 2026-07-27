const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An animal must belong to a seller'],
      index: true
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please specify animal category'],
      index: true
    },
    breedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Breed',
      required: [true, 'Please specify animal breed'],
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide a title for the listing'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'Please specify price']
    },
    negotiable: {
      type: Boolean,
      default: false
    },
    photos: {
      type: [String],
      required: [true, 'Please upload photos of the animal'],
      validate: [
        {
          validator: (arr) => arr.length >= 5,
          message: 'Please upload at least 5 photos of the animal'
        },
        {
          validator: (arr) => arr.length <= 10,
          message: 'Maximum 10 photos are allowed'
        }
      ]
    },
    photoPublicIds: {
      type: [String],
      default: []
    },
    video: {
      type: String,
      required: [true, 'Please upload a live video of the animal']
    },
    videoPublicId: {
      type: String
    },
    gender: {
      type: String,
      enum: ['Female', 'Male'],
      default: 'Female'
    },
    age: {
      type: String,
      required: [true, 'Please specify animal age']
    },
    weight: {
      type: String
    },
    color: {
      type: String
    },
    health: {
      vaccinated: {
        type: Boolean,
        default: false
      },
      healthy: {
        type: Boolean,
        default: true
      },
      pregnant: {
        type: Boolean,
        default: false
      },
      milkCapacity: {
        type: String // e.g. "12 Liters/day" or "12"
      }
    },
    state: {
      type: String,
      required: [true, 'State is required']
    },
    district: {
      type: String,
      required: [true, 'District is required']
    },
    taluka: {
      type: String,
      required: [true, 'Taluka is required']
    },
    village: {
      type: String,
      required: [true, 'Village is required']
    },
    pincode: {
      type: String
    },
    formattedAddress: {
      type: String
    },
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'sold', 'draft'],
      default: 'pending',
      index: true
    },
    views: {
      type: Number,
      default: 0
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    rejectionReason: {
      type: String
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rejectedAt: {
      type: Date
    },
    mediaMetadata: {
      captureTime: {
        type: Date
      },
      latitude: {
        type: Number
      },
      longitude: {
        type: Number
      },
      videoDuration: {
        type: Number // in seconds
      },
      fileSize: {
        type: Number // total bytes
      },
      imageCount: {
        type: Number
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for common queries
animalSchema.index({ categoryId: 1, breedId: 1 });
animalSchema.index({ state: 1, district: 1, taluka: 1 });

const Animal = mongoose.model('Animal', animalSchema);

module.exports = Animal;
