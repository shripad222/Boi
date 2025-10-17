const express = require('express');
const Reminder = require('../models/Reminder');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create reminder
router.post('/', auth, async (req, res) => {
  try {
    const {
      userId,
      type,
      title,
      message,
      scheduledDate,
      reminderMethods,
      recurring,
      metadata
    } = req.body;

    // If user is patient, they can only create reminders for themselves
    if (req.user.role === 'patient' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reminder = new Reminder({
      userId: userId || req.user._id,
      type,
      title,
      message,
      scheduledDate,
      reminderMethods,
      recurring,
      metadata
    });

    await reminder.save();
    await reminder.populate('userId', 'name phone');

    res.status(201).json({
      message: 'Reminder created successfully',
      reminder
    });

  } catch (error) {
    logger.error('Create reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reminders
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, status, userId } = req.query;
    
    let query = {};
    
    // If user is patient, only show their reminders
    if (req.user.role === 'patient') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const reminders = await Reminder.find(query)
      .populate('userId', 'name phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ scheduledDate: -1 });

    const total = await Reminder.countDocuments(query);

    res.json({
      reminders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    logger.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get upcoming reminders for user
router.get('/upcoming', auth, async (req, res) => {
  try {
    const userId = req.user.role === 'patient' ? req.user._id : req.query.userId;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingReminders = await Reminder.find({
      userId,
      scheduledDate: { $gte: now, $lte: nextWeek },
      status: 'pending'
    }).sort({ scheduledDate: 1 });

    res.json({ reminders: upcomingReminders });

  } catch (error) {
    logger.error('Get upcoming reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update reminder
router.put('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && reminder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(reminder, req.body);
    await reminder.save();
    await reminder.populate('userId', 'name phone');

    res.json({
      message: 'Reminder updated successfully',
      reminder
    });

  } catch (error) {
    logger.error('Update reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel reminder
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && reminder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    reminder.status = 'cancelled';
    await reminder.save();

    res.json({
      message: 'Reminder cancelled successfully',
      reminder
    });

  } catch (error) {
    logger.error('Cancel reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete reminder
router.delete('/:id', auth, async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    
    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && reminder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Reminder.findByIdAndDelete(req.params.id);

    res.json({ message: 'Reminder deleted successfully' });

  } catch (error) {
    logger.error('Delete reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reminder statistics
router.get('/stats', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const stats = await Reminder.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Reminder.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const todayReminders = await Reminder.countDocuments({
      scheduledDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    });

    res.json({
      statusStats: stats,
      typeStats,
      todayReminders
    });

  } catch (error) {
    logger.error('Get reminder stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;