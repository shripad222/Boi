const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendOTP, verifyOTP } = require('../utils/twilio');
const logger = require('../utils/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      aadhaar,
      phone,
      email,
      password,
      role = 'patient',
      address,
      emergencyContact,
      biometricData
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ phone }, { aadhaar }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this phone number or Aadhaar'
      });
    }

    // Create new user
    const user = new User({
      name,
      age,
      gender,
      aadhaar,
      phone,
      email,
      password,
      role,
      address,
      emergencyContact,
      biometricData
    });

    await user.save();

    // Send OTP for verification
    const otpSent = await sendOTP(phone);
    
    if (!otpSent) {
      logger.warn(`Failed to send OTP to ${phone}`);
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully. Please verify your phone number.',
      token,
      user: user.toJSON(),
      otpSent
    });

  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { phone, password, biometricData } = req.body;

    // Find user by phone
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password or biometric
    let isValid = false;
    
    if (password) {
      isValid = await user.comparePassword(password);
    } else if (biometricData && user.biometricData) {
      // Simple biometric comparison (in production, use proper biometric SDK)
      isValid = (
        biometricData.fingerprint === user.biometricData.fingerprint ||
        biometricData.faceId === user.biometricData.faceId
      );
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify OTP
router.post('/verify-otp', auth, async (req, res) => {
  try {
    const { otp } = req.body;
    const user = req.user;

    const isValid = await verifyOTP(user.phone, otp);
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    res.json({
      message: 'Phone number verified successfully',
      user: user.toJSON()
    });

  } catch (error) {
    logger.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
});

// Resend OTP
router.post('/resend-otp', auth, async (req, res) => {
  try {
    const user = req.user;
    
    const otpSent = await sendOTP(user.phone);
    
    if (!otpSent) {
      return res.status(500).json({ message: 'Failed to send OTP' });
    }

    res.json({ message: 'OTP sent successfully' });

  } catch (error) {
    logger.error('Resend OTP error:', error);
    res.status(500).json({ message: 'Server error while sending OTP' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout (client-side token removal, but we can track it)
router.post('/logout', auth, async (req, res) => {
  try {
    // In a more sophisticated setup, you might maintain a blacklist of tokens
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;