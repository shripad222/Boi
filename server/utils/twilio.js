const axios = require('axios');
const logger = require('./logger');

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via RapidAPI OTP service
const sendOTP = async (phoneNumber) => {
  try {
    const otp = generateOTP();
    
    // Format phone number to international format
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    const options = {
      method: 'POST',
      url: 'https://otp-authenticator.p.rapidapi.com/enroll/',
      headers: {
        'x-rapidapi-key': '42787bd55cmsh06bbf8ebccc73adp1b5602jsn88aaa7496f3a',
        'x-rapidapi-host': 'otp-authenticator.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: new URLSearchParams({
        phone: formattedPhone,
        message: `Your Smart Health verification code is: ${otp}. Valid for 10 minutes.`,
        otp: otp
      })
    };

    const response = await axios(options);
    
    if (response.data && response.data.success !== false) {
      // Store OTP with expiration (10 minutes)
      otpStore.set(phoneNumber, otp);
      setTimeout(() => {
        otpStore.delete(phoneNumber);
      }, 10 * 60 * 1000);

      logger.info(`OTP sent to ${phoneNumber} via RapidAPI`);
      return true;
    } else {
      logger.error('Failed to send OTP via RapidAPI:', response.data);
      return false;
    }

  } catch (error) {
    logger.error('Failed to send OTP via RapidAPI:', error);
    
    // Fallback: Store OTP for demo purposes
    const otp = generateOTP();
    otpStore.set(phoneNumber, otp);
    setTimeout(() => {
      otpStore.delete(phoneNumber);
    }, 10 * 60 * 1000);
    
    logger.warn(`OTP API failed, using demo OTP: ${otp} for ${phoneNumber}`);
    console.log(`Demo OTP for ${phoneNumber}: ${otp}`); // For testing
    return true;
  }
};

// Verify OTP
const verifyOTP = async (phoneNumber, otp) => {
  const storedOTP = otpStore.get(phoneNumber);
  
  if (!storedOTP) {
    logger.warn(`No OTP found for ${phoneNumber}`);
    return false;
  }

  if (storedOTP === otp) {
    otpStore.delete(phoneNumber);
    logger.info(`OTP verified successfully for ${phoneNumber}`);
    return true;
  }

  logger.warn(`Invalid OTP for ${phoneNumber}`);
  return false;
};

// Send SMS reminder using RapidAPI
const sendSMSReminder = async (phoneNumber, message) => {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
    
    const options = {
      method: 'POST',
      url: 'https://otp-authenticator.p.rapidapi.com/enroll/',
      headers: {
        'x-rapidapi-key': '42787bd55cmsh06bbf8ebccc73adp1b5602jsn88aaa7496f3a',
        'x-rapidapi-host': 'otp-authenticator.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: new URLSearchParams({
        phone: formattedPhone,
        message: message
      })
    };

    const response = await axios(options);
    
    if (response.data && response.data.success !== false) {
      logger.info(`SMS reminder sent to ${phoneNumber}`);
      return true;
    } else {
      logger.error('Failed to send SMS reminder:', response.data);
      return false;
    }

  } catch (error) {
    logger.error('Failed to send SMS reminder:', error);
    logger.warn(`SMS API failed, simulating SMS send to ${phoneNumber}`);
    return true; // Return true for demo purposes
  }
};

// Make voice call (simulated for now)
const makeVoiceCall = async (phoneNumber, message) => {
  logger.warn('Voice call feature simulated. In production, integrate with voice API.');
  logger.info(`Simulated voice call to ${phoneNumber}: ${message}`);
  return true;
};

// Handle IVR responses (simulated)
const handleIVRResponse = (digit, userId) => {
  const responses = {
    '1': 'Your last checkup was normal. Blood pressure and sugar levels are within range.',
    '2': 'The nearest health center is Village Health Center, 2 km away. Contact: 9876543210',
    '3': 'For emergencies, call 108 or visit the nearest hospital immediately.',
    '4': 'For more information, visit our website or contact our helpdesk at 1800-123-4567'
  };

  return responses[digit] || 'Invalid option. Please try again.';
};

module.exports = {
  sendOTP,
  verifyOTP,
  sendSMSReminder,
  makeVoiceCall,
  handleIVRResponse
};