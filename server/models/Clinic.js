const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hospital', 'clinic', 'health_center', 'pharmacy', 'diagnostic_center']
  },
  address: {
    street: String,
    village: String,
    district: String,
    state: String,
    pincode: String,
    landmark: String
  },
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  services: [{
    name: String,
    description: String,
    available: { type: Boolean, default: true }
  }],
  operatingHours: {
    monday: { open: String, close: String, closed: Boolean },
    tuesday: { open: String, close: String, closed: Boolean },
    wednesday: { open: String, close: String, closed: Boolean },
    thursday: { open: String, close: String, closed: Boolean },
    friday: { open: String, close: String, closed: Boolean },
    saturday: { open: String, close: String, closed: Boolean },
    sunday: { open: String, close: String, closed: Boolean }
  },
  staff: [{
    name: String,
    designation: String,
    specialization: String,
    available: { type: Boolean, default: true }
  }],
  facilities: [String], // e.g., ['ambulance', 'emergency', 'lab', 'pharmacy']
  rating: {
    average: { type: Number, min: 0, max: 5, default: 0 },
    count: { type: Number, default: 0 }
  },
  verified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
clinicSchema.index({ coordinates: '2dsphere' });
clinicSchema.index({ type: 1, isActive: 1 });
clinicSchema.index({ 'address.district': 1, 'address.state': 1 });

// Static method to find nearby clinics
clinicSchema.statics.findNearby = function(latitude, longitude, maxDistance = 10000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance // in meters
      }
    },
    isActive: true
  });
};

module.exports = mongoose.model('Clinic', clinicSchema);