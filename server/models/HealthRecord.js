const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  checkupDate: {
    type: Date,
    default: Date.now
  },
  vitalSigns: {
    bloodPressure: {
      systolic: { type: Number, min: 70, max: 250 },
      diastolic: { type: Number, min: 40, max: 150 }
    },
    bloodSugar: {
      fasting: { type: Number, min: 50, max: 500 },
      postMeal: { type: Number, min: 50, max: 500 },
      random: { type: Number, min: 50, max: 500 }
    },
    heartRate: {
      type: Number,
      min: 40,
      max: 200
    },
    temperature: {
      type: Number,
      min: 95,
      max: 110
    },
    oxygenSaturation: {
      type: Number,
      min: 70,
      max: 100
    }
  },
  physicalMeasurements: {
    height: {
      type: Number,
      min: 50,
      max: 250 // in cm
    },
    weight: {
      type: Number,
      min: 10,
      max: 300 // in kg
    },
    bmi: {
      type: Number,
      min: 10,
      max: 50
    }
  },
  examinations: {
    eyeVision: {
      leftEye: String,
      rightEye: String,
      notes: String
    },
    earCheck: {
      leftEar: String,
      rightEar: String,
      notes: String
    },
    mouthCheck: {
      teeth: String,
      gums: String,
      throat: String,
      notes: String
    },
    generalExamination: {
      skin: String,
      lymphNodes: String,
      abdomen: String,
      chest: String,
      notes: String
    }
  },
  symptoms: [{
    symptom: String,
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe']
    },
    duration: String
  }],
  diagnosis: {
    primary: String,
    secondary: [String],
    icdCodes: [String]
  },
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  recommendations: {
    lifestyle: [String],
    followUp: {
      required: Boolean,
      date: Date,
      reason: String
    },
    referral: {
      required: Boolean,
      specialist: String,
      reason: String,
      urgency: {
        type: String,
        enum: ['low', 'medium', 'high', 'emergency']
      }
    }
  },
  doctorRemarks: String,
  reportGenerated: {
    type: Boolean,
    default: false
  },
  reportUrl: String,
  qrCode: String,
  nextCheckupDate: Date,
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Indexes for better performance
healthRecordSchema.index({ userId: 1, checkupDate: -1 });
healthRecordSchema.index({ doctorId: 1, checkupDate: -1 });
healthRecordSchema.index({ 'recommendations.followUp.date': 1 });

// Calculate BMI before saving
healthRecordSchema.pre('save', function(next) {
  if (this.physicalMeasurements.height && this.physicalMeasurements.weight) {
    const heightInMeters = this.physicalMeasurements.height / 100;
    this.physicalMeasurements.bmi = (this.physicalMeasurements.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  next();
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);