const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  verificationMode: {
    type: String,
    enum: ['manual', 'auto', 'ocr_manual'],
    default: 'manual'
  },
  maxUploadSize: {
    type: Number,
    default: 5 // in MB
  },
  allowedFileTypes: {
    type: [String],
    default: ['jpeg', 'jpg', 'png', 'webp', 'pdf']
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
