const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required']
    },
    originalName: String,
    mimeType: String,
    size: Number,
    url: {
      type: String,
      required: [true, 'File URL is required']
    },
    publicId: {
      type: String
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Upload must be associated with a user']
    }
  },
  {
    timestamps: true
  }
);

const Upload = mongoose.model('Upload', uploadSchema);

module.exports = Upload;
