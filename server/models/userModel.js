const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    max: 50,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  isAvatarImageSet: {
    type: Boolean,
    default: false,
  },
  avatarImage: {
    type: String,
    default: "",
  },
  role: {
    type: String,
    enum: ["emp", "admin", "applicant"],
    default: "Applicant",
  },
  // New fields for emergency response personnel
  specialization: {
    type: String,
    enum: [
      'Emergency Medicine',
      'Trauma',
      'Critical Care',
      'Pediatric Emergency',
      'Cardiac Emergency',
      'Disaster Response',
      'General Emergency'
    ],
    
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    max: 50,
    
  },
  assignedEmergencies: {
    type: Number,
    default: 0,
    min: 0
  },
  completedEmergencies: {
    type: Number,
    default: 0,
    min: 0
  },
  responseTime: {
    type: String,
    default: 'N/A'
  },
  successRate: {
    type: String,
    default: 'N/A'
  },
  certifications: [{
    type: String,
    enum: [
      'Advanced Cardiac Life Support',
      'Pediatric Advanced Life Support',
      'Basic Life Support',
      'Advanced Trauma Life Support',
      'Emergency Medical Technician',
      'Paramedic Certification',
      'Crisis Intervention',
      'Hazardous Materials Certification'
    ]
  }],
  availabilityStatus: {
    type: String,
    enum: ['Available', 'On Call', 'On Emergency', 'Off Duty', 'On Break'],
    default: 'Off Duty'
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Index for geospatial queries if you need to find nearest responders
userSchema.index({ location: '2dsphere' });

// Virtual property to calculate active emergencies
userSchema.virtual('activeEmergencies').get(function() {
  return this.assignedEmergencies - this.completedEmergencies;
});

// Method to update availability status
userSchema.methods.updateAvailability = function(status) {
  this.availabilityStatus = status;
  this.lastActive = new Date();
  return this.save();
};

// Method to update response metrics
userSchema.methods.updateMetrics = function(responseTimeInMins, wasSuccessful) {
  const totalCompleted = this.completedEmergencies + 1;
  const currentSuccessRate = parseFloat(this.successRate) || 0;
  
  // Update completed emergencies
  this.completedEmergencies = totalCompleted;
  
  // Update response time (running average)
  const currentResponseTime = parseFloat(this.responseTime) || 0;
  const newResponseTime = ((currentResponseTime * (totalCompleted - 1)) + responseTimeInMins) / totalCompleted;
  this.responseTime = newResponseTime.toFixed(1) + ' mins';
  
  // Update success rate
  if (wasSuccessful) {
    const newSuccessRate = ((currentSuccessRate * (totalCompleted - 1)) + 100) / totalCompleted;
    this.successRate = newSuccessRate.toFixed(1) + '%';
  }
  
  return this.save();
};

module.exports = mongoose.model("Users", userSchema);