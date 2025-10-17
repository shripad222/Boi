const express = require('express');
const HealthRecord = require('../models/HealthRecord');
const Reminder = require('../models/Reminder');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Create new health record (doctor only)
router.post('/', auth, authorize('doctor'), async (req, res) => {
  try {
    const healthRecord = new HealthRecord({
      ...req.body,
      doctorId: req.user._id
    });

    await healthRecord.save();
    await healthRecord.populate('userId', 'name phone age gender');
    await healthRecord.populate('doctorId', 'name');

    // Create medication reminders if medications are prescribed
    if (healthRecord.medications && healthRecord.medications.length > 0) {
      await Reminder.createMedicationReminders(
        healthRecord.userId._id,
        healthRecord.medications,
        healthRecord._id
      );
    }

    // Create follow-up reminder if required
    if (healthRecord.recommendations.followUp.required && healthRecord.recommendations.followUp.date) {
      await new Reminder({
        userId: healthRecord.userId._id,
        type: 'followup',
        title: 'Follow-up Appointment Reminder',
        message: `You have a follow-up appointment scheduled. Reason: ${healthRecord.recommendations.followUp.reason}`,
        scheduledDate: new Date(healthRecord.recommendations.followUp.date.getTime() - 24 * 60 * 60 * 1000), // 1 day before
        metadata: {
          healthRecordId: healthRecord._id,
          doctorName: req.user.name
        }
      }).save();
    }

    res.status(201).json({
      message: 'Health record created successfully',
      healthRecord
    });

  } catch (error) {
    logger.error('Create health record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get health records
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, startDate, endDate } = req.query;
    
    let query = {};
    
    // If user is patient, only show their records
    if (req.user.role === 'patient') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }
    
    // If user is doctor, show records they created
    if (req.user.role === 'doctor' && !userId) {
      query.doctorId = req.user._id;
    }

    // Date range filter
    if (startDate || endDate) {
      query.checkupDate = {};
      if (startDate) query.checkupDate.$gte = new Date(startDate);
      if (endDate) query.checkupDate.$lte = new Date(endDate);
    }

    const healthRecords = await HealthRecord.find(query)
      .populate('userId', 'name phone age gender')
      .populate('doctorId', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ checkupDate: -1 });

    const total = await HealthRecord.countDocuments(query);

    res.json({
      healthRecords,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    logger.error('Get health records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single health record
router.get('/:id', auth, async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id)
      .populate('userId', 'name phone age gender address')
      .populate('doctorId', 'name');

    if (!healthRecord) {
      return res.status(404).json({ message: 'Health record not found' });
    }

    // Check authorization
    if (req.user.role === 'patient' && healthRecord.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ healthRecord });

  } catch (error) {
    logger.error('Get health record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update health record (doctor only)
router.put('/:id', auth, authorize('doctor'), async (req, res) => {
  try {
    const healthRecord = await HealthRecord.findById(req.params.id);

    if (!healthRecord) {
      return res.status(404).json({ message: 'Health record not found' });
    }

    // Check if doctor owns this record
    if (healthRecord.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    Object.assign(healthRecord, req.body);
    await healthRecord.save();
    
    await healthRecord.populate('userId', 'name phone age gender');
    await healthRecord.populate('doctorId', 'name');

    res.json({
      message: 'Health record updated successfully',
      healthRecord
    });

  } catch (error) {
    logger.error('Update health record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get health statistics
router.get('/stats/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check authorization
    if (req.user.role === 'patient' && userId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const records = await HealthRecord.find({ userId }).sort({ checkupDate: 1 });
    
    if (records.length === 0) {
      return res.json({ message: 'No health records found', stats: {} });
    }

    // Calculate statistics
    const stats = {
      totalRecords: records.length,
      firstCheckup: records[0].checkupDate,
      lastCheckup: records[records.length - 1].checkupDate,
      averages: {},
      trends: {},
      alerts: []
    };

    // Calculate averages
    const vitals = ['bloodPressure', 'bloodSugar', 'heartRate', 'temperature'];
    const measurements = ['height', 'weight', 'bmi'];

    vitals.forEach(vital => {
      const values = records
        .map(r => r.vitalSigns[vital])
        .filter(v => v && Object.keys(v).length > 0);
      
      if (values.length > 0) {
        stats.averages[vital] = {};
        Object.keys(values[0]).forEach(key => {
          const nums = values.map(v => v[key]).filter(n => n);
          if (nums.length > 0) {
            stats.averages[vital][key] = (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1);
          }
        });
      }
    });

    measurements.forEach(measurement => {
      const values = records
        .map(r => r.physicalMeasurements[measurement])
        .filter(v => v);
      
      if (values.length > 0) {
        stats.averages[measurement] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
      }
    });

    // Generate health alerts based on latest values
    const latest = records[records.length - 1];
    if (latest.vitalSigns.bloodPressure.systolic > 140 || latest.vitalSigns.bloodPressure.diastolic > 90) {
      stats.alerts.push({ type: 'warning', message: 'High blood pressure detected' });
    }
    if (latest.vitalSigns.bloodSugar.fasting > 126) {
      stats.alerts.push({ type: 'warning', message: 'High fasting blood sugar' });
    }
    if (latest.physicalMeasurements.bmi > 30) {
      stats.alerts.push({ type: 'info', message: 'BMI indicates obesity' });
    }

    res.json({ stats });

  } catch (error) {
    logger.error('Get health stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;