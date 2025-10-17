const express = require('express');
const Clinic = require('../models/Clinic');
const { auth, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get nearby clinics
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10000, type } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    let query = {
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      },
      isActive: true
    };

    if (type) {
      query.type = type;
    }

    const clinics = await Clinic.find(query).limit(20);

    // Calculate distances
    const clinicsWithDistance = clinics.map(clinic => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        clinic.coordinates.latitude,
        clinic.coordinates.longitude
      );

      return {
        ...clinic.toObject(),
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    res.json({ clinics: clinicsWithDistance });

  } catch (error) {
    logger.error('Get nearby clinics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all clinics
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, district, state, search } = req.query;
    
    let query = { isActive: true };
    
    if (type) query.type = type;
    if (district) query['address.district'] = new RegExp(district, 'i');
    if (state) query['address.state'] = new RegExp(state, 'i');
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'address.village': { $regex: search, $options: 'i' } },
        { 'address.district': { $regex: search, $options: 'i' } }
      ];
    }

    const clinics = await Clinic.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });

    const total = await Clinic.countDocuments(query);

    res.json({
      clinics,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (error) {
    logger.error('Get clinics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single clinic
router.get('/:id', auth, async (req, res) => {
  try {
    const clinic = await Clinic.findById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({ clinic });

  } catch (error) {
    logger.error('Get clinic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create clinic (admin only)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const clinic = new Clinic(req.body);
    await clinic.save();

    res.status(201).json({
      message: 'Clinic created successfully',
      clinic
    });

  } catch (error) {
    logger.error('Create clinic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update clinic (admin only)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({
      message: 'Clinic updated successfully',
      clinic
    });

  } catch (error) {
    logger.error('Update clinic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete clinic (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const clinic = await Clinic.findByIdAndDelete(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    res.json({ message: 'Clinic deleted successfully' });

  } catch (error) {
    logger.error('Delete clinic error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get clinic types
router.get('/meta/types', (req, res) => {
  const types = [
    { value: 'hospital', label: 'Hospital' },
    { value: 'clinic', label: 'Clinic' },
    { value: 'health_center', label: 'Health Center' },
    { value: 'pharmacy', label: 'Pharmacy' },
    { value: 'diagnostic_center', label: 'Diagnostic Center' }
  ];

  res.json({ types });
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

module.exports = router;