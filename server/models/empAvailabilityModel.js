const mongoose = require('mongoose');

// Define the schema
const EMPAvailabilitySchema = new mongoose.Schema({
  empId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true // Add index for better query performance
  },
  isAvailable: { 
    type: Boolean, 
    default: false,
    index: true // Add index since we query by availability
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  // Add timestamps for better tracking
  timestamps: true,
  // Add toJSON transform to clean up response
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Add compound index for common queries
EMPAvailabilitySchema.index({ isAvailable: 1, lastUpdated: 1 });

// Add instance method to update availability
EMPAvailabilitySchema.methods.updateAvailability = function(isAvailable) {
  this.isAvailable = isAvailable;
  this.lastUpdated = new Date();
  return this.save();
};

// Add static method to find available EMPs
EMPAvailabilitySchema.statics.findAvailableEMPs = function() {
  return this.find({ isAvailable: true })
    .sort({ lastUpdated: 1 })
    .populate('empId');
};

// Middleware to update lastUpdated on save
EMPAvailabilitySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Create and export the model
const EMPAvailability = mongoose.model('EMPAvailability', EMPAvailabilitySchema);

module.exports = EMPAvailability;