const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your name']
    },
    fullName: {
      type: String
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      select: false
    },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer'
    },
    phoneNumber: {
      type: String
    },
    mobile: {
      type: String
    },
    profilePhoto: {
      type: String
    },
    profilePhotoPublicId: {
      type: String
    },
    village: {
      type: String
    },
    taluka: {
      type: String
    },
    district: {
      type: String
    },
    state: {
      type: String
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'mr'
    },
    isProfileCompleted: {
      type: Boolean,
      default: false
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    verification: {
      status: {
        type: String,
        enum: ['unverified', 'pending', 'approved', 'rejected'],
        default: 'unverified'
      },
      receiptUrl: String,
      receiptPublicId: String,
      receiptImage: String,
      receiptImagePublicId: String,
      farmerName: String,
      dairyName: String,
      receiptDate: Date,
      submittedAt: Date,
      approvedAt: Date,
      rejectedReason: String,
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
      }
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    premiumExpiresAt: {
      type: Date
    },
    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    marketPriceAccess: {
      hasAccess: {
        type: Boolean,
        default: false
      },
      source: {
        type: String,
        default: 'none'
      },
      unlockedAt: {
        type: Date
      },
      paymentId: {
        type: String
      }
    },
    feedPlannerAccess: {
      hasAccess: {
        type: Boolean,
        default: false
      },
      source: {
        type: String,
        default: 'none'
      },
      unlockedAt: {
        type: Date
      },
      paymentId: {
        type: String
      }
    },
    fcmToken: {
      type: String,
      default: null,
      index: true
    },
    fcmTokens: [
      {
        token: { type: String, required: true },
        platform: { type: String, default: 'android' },
        updatedAt: { type: Date, default: Date.now }
      }
    ],
    pushNotificationEnabled: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
