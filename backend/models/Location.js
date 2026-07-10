const mongoose = require('mongoose');

// ==========================================
// 1. State Schema
// ==========================================
const stateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide state name'],
      unique: true,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

// ==========================================
// 2. District Schema
// ==========================================
const districtSchema = new mongoose.Schema(
  {
    stateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: [true, 'District must belong to a State'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide district name'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

districtSchema.index({ stateId: 1, name: 1 }, { unique: true });

// ==========================================
// 3. Taluka Schema
// ==========================================
const talukaSchema = new mongoose.Schema(
  {
    districtId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'Taluka must belong to a District'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide taluka name'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

talukaSchema.index({ districtId: 1, name: 1 }, { unique: true });

// ==========================================
// 4. Village Schema
// ==========================================
const villageSchema = new mongoose.Schema(
  {
    talukaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Taluka',
      required: [true, 'Village must belong to a Taluka'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide village name'],
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  { timestamps: true }
);

villageSchema.index({ talukaId: 1, name: 1 }, { unique: true });

// Exporting all models
const State = mongoose.model('State', stateSchema);
const District = mongoose.model('District', districtSchema);
const Taluka = mongoose.model('Taluka', talukaSchema);
const Village = mongoose.model('Village', villageSchema);

module.exports = {
  State,
  District,
  Taluka,
  Village
};
