const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['checkup', 'medication', 'vaccination', 'followup', 'custom']
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  reminderMethods: {
    sms: { type: Boolean, default: true },
    voice: { type: Boolean, default: false },
    push: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending'
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastAttempt: Date,
  sentAt: Date,
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: Number, // e.g., every 2 weeks
    endDate: Date
  },
  metadata: {
    healthRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthRecord'
    },
    medicationName: String,
    dosage: String,
    doctorName: String
  }
}, {
  timestamps: true
});

// Indexes
reminderSchema.index({ userId: 1, scheduledDate: 1 });
reminderSchema.index({ scheduledDate: 1, status: 1 });
reminderSchema.index({ type: 1, status: 1 });

// Static method to create medication reminders
reminderSchema.statics.createMedicationReminders = async function(userId, medications, healthRecordId) {
  const reminders = [];
  
  for (const med of medications) {
    if (med.frequency && med.duration) {
      // Parse frequency (e.g., "twice daily", "once daily")
      const frequencyMap = {
        'once daily': 1,
        'twice daily': 2,
        'thrice daily': 3,
        'four times daily': 4
      };
      
      const timesPerDay = frequencyMap[med.frequency.toLowerCase()] || 1;
      const durationDays = parseInt(med.duration.match(/\d+/)?.[0]) || 7;
      
      // Create reminders for each day
      for (let day = 0; day < durationDays; day++) {
        for (let time = 0; time < timesPerDay; time++) {
          const reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + day);
          reminderDate.setHours(8 + (time * 8), 0, 0, 0); // 8 AM, 4 PM, 12 AM
          
          reminders.push({
            userId,
            type: 'medication',
            title: `Medication Reminder: ${med.name}`,
            message: `Time to take your medication: ${med.name} (${med.dosage}). ${med.instructions || ''}`,
            scheduledDate: reminderDate,
            metadata: {
              healthRecordId,
              medicationName: med.name,
              dosage: med.dosage
            }
          });
        }
      }
    }
  }
  
  return this.insertMany(reminders);
};

module.exports = mongoose.model('Reminder', reminderSchema);