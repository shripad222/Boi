const express = require('express');
const User = require('../models/User');
const HealthRecord = require('../models/HealthRecord');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user: user.toJSON() });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'email', 'address', 'emergencyContact', 'preferences'];
    
    // Filter allowed updates
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      filteredUpdates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get recent health records
    const recentRecords = await HealthRecord.find({ userId })
      .populate('doctorId', 'name')
      .sort({ checkupDate: -1 })
      .limit(5);

    // Get health statistics
    const totalRecords = await HealthRecord.countDocuments({ userId });
    
    // Get latest vital signs for trends
    const latestRecord = await HealthRecord.findOne({ userId })
      .sort({ checkupDate: -1 });

    // Calculate health trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const trendData = await HealthRecord.find({
      userId,
      checkupDate: { $gte: sixMonthsAgo }
    }).sort({ checkupDate: 1 });

    // Process trend data for charts
    const trends = {
      bloodPressure: [],
      bloodSugar: [],
      weight: [],
      heartRate: []
    };

    trendData.forEach(record => {
      const date = record.checkupDate.toISOString().split('T')[0];
      
      if (record.vitalSigns.bloodPressure.systolic) {
        trends.bloodPressure.push({
          date,
          systolic: record.vitalSigns.bloodPressure.systolic,
          diastolic: record.vitalSigns.bloodPressure.diastolic
        });
      }
      
      if (record.vitalSigns.bloodSugar.fasting) {
        trends.bloodSugar.push({
          date,
          fasting: record.vitalSigns.bloodSugar.fasting,
          postMeal: record.vitalSigns.bloodSugar.postMeal
        });
      }
      
      if (record.physicalMeasurements.weight) {
        trends.weight.push({
          date,
          weight: record.physicalMeasurements.weight,
          bmi: record.physicalMeasurements.bmi
        });
      }
      
      if (record.vitalSigns.heartRate) {
        trends.heartRate.push({
          date,
          heartRate: record.vitalSigns.heartRate
        });
      }
    });

    res.json({
      user: req.user.toJSON(),
      recentRecords,
      statistics: {
        totalRecords,
        lastCheckup: latestRecord?.checkupDate,
        nextCheckup: latestRecord?.nextCheckupDate
      },
      trends,
      latestVitals: latestRecord?.vitalSigns || {}
    });

  } catch (error) {
    logger.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (admin only)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { aadhaar: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -biometricData')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID (admin/doctor only)
router.get('/:id', auth, authorize('admin', 'doctor'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's health records
    const healthRecords = await HealthRecord.find({ userId: user._id })
      .populate('doctorId', 'name')
      .sort({ checkupDate: -1 });

    res.json({
      user: user.toJSON(),
      healthRecords
    });

  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: user.toJSON()
    });

  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Also delete related health records
    await HealthRecord.deleteMany({ userId: user._id });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;