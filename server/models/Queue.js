const mongoose = require('mongoose');

const queueSchema = new mongoose.Schema({
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
  tokenNumber: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
    default: 'waiting'
  },
  priority: {
    type: String,
    enum: ['normal', 'urgent', 'emergency'],
    default: 'normal'
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  startTime: Date,
  endTime: Date,
  estimatedWaitTime: Number, // in minutes
  campId: {
    type: String,
    required: true
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
queueSchema.index({ campId: 1, status: 1, tokenNumber: 1 });
queueSchema.index({ doctorId: 1, status: 1 });
queueSchema.index({ userId: 1, createdAt: -1 });

// Static method to get next token number
queueSchema.statics.getNextTokenNumber = async function(campId) {
  const lastToken = await this.findOne({ campId })
    .sort({ tokenNumber: -1 })
    .select('tokenNumber');
  
  return lastToken ? lastToken.tokenNumber + 1 : 1;
};

// Static method to get queue position
queueSchema.statics.getQueuePosition = async function(userId, campId) {
  const userQueue = await this.findOne({ userId, campId, status: 'waiting' });
  if (!userQueue) return null;
  
  const position = await this.countDocuments({
    campId,
    status: 'waiting',
    tokenNumber: { $lt: userQueue.tokenNumber }
  });
  
  return position + 1;
};

module.exports = mongoose.model('Queue', queueSchema);