const express = require('express');
const Queue = require('../models/Queue');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Add user to queue (admin/assistant only)
router.post('/add', auth, authorize('admin'), async (req, res) => {
  try {
    const { userId, doctorId, campId, priority = 'normal' } = req.body;

    // Check if user is already in queue for this camp
    const existingQueue = await Queue.findOne({
      userId,
      campId,
      status: { $in: ['waiting', 'in-progress'] }
    });

    if (existingQueue) {
      return res.status(400).json({ message: 'User is already in queue for this camp' });
    }

    // Get next token number
    const tokenNumber = await Queue.getNextTokenNumber(campId);

    const queueEntry = new Queue({
      userId,
      doctorId,
      campId,
      tokenNumber,
      priority
    });

    await queueEntry.save();
    await queueEntry.populate('userId', 'name phone age');
    await queueEntry.populate('doctorId', 'name');

    // Emit real-time update
    req.io.to('queue-updates').emit('queue-updated', {
      action: 'added',
      queueEntry
    });

    res.status(201).json({
      message: 'User added to queue successfully',
      queueEntry,
      tokenNumber
    });

  } catch (error) {
    logger.error('Add to queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get queue for a camp/doctor
router.get('/:campId', auth, async (req, res) => {
  try {
    const { campId } = req.params;
    const { doctorId, status = 'waiting' } = req.query;

    let query = { campId };
    if (doctorId) query.doctorId = doctorId;
    if (status !== 'all') query.status = status;

    const queue = await Queue.find(query)
      .populate('userId', 'name phone age gender')
      .populate('doctorId', 'name')
      .sort({ priority: -1, tokenNumber: 1 }); // Emergency first, then by token number

    // Calculate estimated wait times
    const queueWithEstimates = queue.map((entry, index) => {
      if (entry.status === 'waiting') {
        entry.estimatedWaitTime = (index + 1) * 15; // Assume 15 minutes per patient
      }
      return entry;
    });

    res.json({ queue: queueWithEstimates });

  } catch (error) {
    logger.error('Get queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's queue position
router.get('/position/:userId/:campId', auth, async (req, res) => {
  try {
    const { userId, campId } = req.params;

    // Check authorization
    if (req.user.role === 'patient' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const position = await Queue.getQueuePosition(userId, campId);
    
    if (!position) {
      return res.status(404).json({ message: 'User not found in queue' });
    }

    const queueEntry = await Queue.findOne({ userId, campId, status: 'waiting' })
      .populate('doctorId', 'name');

    res.json({
      position,
      tokenNumber: queueEntry.tokenNumber,
      estimatedWaitTime: position * 15,
      doctor: queueEntry.doctorId
    });

  } catch (error) {
    logger.error('Get queue position error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start consultation (doctor only)
router.put('/start/:queueId', auth, authorize('doctor'), async (req, res) => {
  try {
    const { queueId } = req.params;

    const queueEntry = await Queue.findById(queueId);
    
    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    // Check if doctor owns this queue entry
    if (queueEntry.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (queueEntry.status !== 'waiting') {
      return res.status(400).json({ message: 'Patient is not waiting' });
    }

    queueEntry.status = 'in-progress';
    queueEntry.startTime = new Date();
    await queueEntry.save();

    await queueEntry.populate('userId', 'name phone age gender');
    await queueEntry.populate('doctorId', 'name');

    // Emit real-time update
    req.io.to('queue-updates').emit('queue-updated', {
      action: 'started',
      queueEntry
    });

    res.json({
      message: 'Consultation started',
      queueEntry
    });

  } catch (error) {
    logger.error('Start consultation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete consultation (doctor only)
router.put('/complete/:queueId', auth, authorize('doctor'), async (req, res) => {
  try {
    const { queueId } = req.params;
    const { notes } = req.body;

    const queueEntry = await Queue.findById(queueId);
    
    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    // Check if doctor owns this queue entry
    if (queueEntry.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (queueEntry.status !== 'in-progress') {
      return res.status(400).json({ message: 'Consultation is not in progress' });
    }

    queueEntry.status = 'completed';
    queueEntry.endTime = new Date();
    queueEntry.notes = notes;
    await queueEntry.save();

    await queueEntry.populate('userId', 'name phone age gender');
    await queueEntry.populate('doctorId', 'name');

    // Get next patient in queue
    const nextPatient = await Queue.findOne({
      campId: queueEntry.campId,
      doctorId: queueEntry.doctorId,
      status: 'waiting'
    }).sort({ priority: -1, tokenNumber: 1 })
      .populate('userId', 'name phone age gender');

    // Emit real-time updates
    req.io.to('queue-updates').emit('queue-updated', {
      action: 'completed',
      queueEntry,
      nextPatient
    });

    // Notify doctor about next patient
    if (nextPatient) {
      req.io.to(`doctor-${queueEntry.doctorId}`).emit('next-patient', nextPatient);
    }

    res.json({
      message: 'Consultation completed',
      queueEntry,
      nextPatient
    });

  } catch (error) {
    logger.error('Complete consultation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel queue entry
router.put('/cancel/:queueId', auth, async (req, res) => {
  try {
    const { queueId } = req.params;

    const queueEntry = await Queue.findById(queueId);
    
    if (!queueEntry) {
      return res.status(404).json({ message: 'Queue entry not found' });
    }

    // Check authorization
    const canCancel = (
      req.user.role === 'admin' ||
      (req.user.role === 'patient' && queueEntry.userId.toString() === req.user._id.toString()) ||
      (req.user.role === 'doctor' && queueEntry.doctorId.toString() === req.user._id.toString())
    );

    if (!canCancel) {
      return res.status(403).json({ message: 'Access denied' });
    }

    queueEntry.status = 'cancelled';
    await queueEntry.save();

    await queueEntry.populate('userId', 'name phone age gender');
    await queueEntry.populate('doctorId', 'name');

    // Emit real-time update
    req.io.to('queue-updates').emit('queue-updated', {
      action: 'cancelled',
      queueEntry
    });

    res.json({
      message: 'Queue entry cancelled',
      queueEntry
    });

  } catch (error) {
    logger.error('Cancel queue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get queue statistics
router.get('/stats/:campId', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const { campId } = req.params;

    const stats = await Queue.aggregate([
      { $match: { campId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgWaitTime: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                { $subtract: ['$startTime', '$checkInTime'] },
                null
              ]
            }
          }
        }
      }
    ]);

    const totalPatients = await Queue.countDocuments({ campId });
    const completedToday = await Queue.countDocuments({
      campId,
      status: 'completed',
      endTime: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });

    res.json({
      stats,
      totalPatients,
      completedToday
    });

  } catch (error) {
    logger.error('Get queue stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;