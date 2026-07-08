const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin profile must be linked to a User'],
      unique: true
    },
    permissions: [
      {
        type: String,
        enum: ['manage_users', 'manage_animals', 'manage_verifications', 'all'],
        default: ['all']
      }
    ],
    actionLogs: [
      {
        action: String,
        targetId: mongoose.Schema.Types.ObjectId,
        targetModel: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
