const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      lowercase: true,
      trim: true
    },
    otp: {
      type: String,
      required: [true, 'OTP is required']
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration time is required']
    },
    attempts: {
      type: Number,
      default: 0
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
// Automatically delete document when current time exceeds expiresAt
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1 });

// Pre-save hook to hash the OTP
otpSchema.pre('save', async function (next) {
  if (this.isModified('otp')) {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
  }
  next();
});

// Instance method to compare OTP
otpSchema.methods.compareOtp = async function (candidateOtp) {
  return await bcrypt.compare(candidateOtp, this.otp);
};

const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
