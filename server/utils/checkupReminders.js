const cron = require('node-cron');
const HealthRecord = require('../models/HealthRecord');
const Reminder = require('../models/Reminder');
const { sendSMSReminder, makeVoiceCall } = require('./twilio');
const logger = require('./logger');

// Check for upcoming and overdue checkups daily at 9 AM
const startCheckupReminderSystem = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      await checkUpcomingCheckups();
      await checkOverdueCheckups();
    } catch (error) {
      logger.error('Checkup reminder system error:', error);
    }
  });

  logger.info('Checkup reminder system started');
};

// Check for checkups in the next 3 days
const checkUpcomingCheckups = async () => {
  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);

  try {
    const upcomingCheckups = await HealthRecord.find({
      'recommendations.followUp.required': true,
      'recommendations.followUp.date': {
        $gte: today,
        $lte: threeDaysFromNow
      }
    }).populate('userId', 'name phone preferences');

    for (const record of upcomingCheckups) {
      const checkupDate = new Date(record.recommendations.followUp.date);
      const daysUntil = Math.ceil((checkupDate - today) / (1000 * 60 * 60 * 24));
      
      // Check if reminder already sent for this checkup
      const existingReminder = await Reminder.findOne({
        userId: record.userId._id,
        'metadata.healthRecordId': record._id,
        type: 'checkup',
        status: 'sent'
      });

      if (!existingReminder) {
        await createCheckupReminder(record, daysUntil, 'upcoming');
      }
    }

    logger.info(`Processed ${upcomingCheckups.length} upcoming checkups`);
  } catch (error) {
    logger.error('Error checking upcoming checkups:', error);
  }
};

// Check for overdue checkups
const checkOverdueCheckups = async () => {
  const today = new Date();
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  try {
    const overdueCheckups = await HealthRecord.find({
      'recommendations.followUp.required': true,
      'recommendations.followUp.date': {
        $gte: sevenDaysAgo,
        $lt: today
      }
    }).populate('userId', 'name phone preferences');

    for (const record of overdueCheckups) {
      const checkupDate = new Date(record.recommendations.followUp.date);
      const daysOverdue = Math.ceil((today - checkupDate) / (1000 * 60 * 60 * 24));
      
      // Send overdue reminder only once per week
      const lastOverdueReminder = await Reminder.findOne({
        userId: record.userId._id,
        'metadata.healthRecordId': record._id,
        type: 'checkup',
        status: 'sent',
        createdAt: { $gte: sevenDaysAgo }
      });

      if (!lastOverdueReminder) {
        await createCheckupReminder(record, daysOverdue, 'overdue');
      }
    }

    logger.info(`Processed ${overdueCheckups.length} overdue checkups`);
  } catch (error) {
    logger.error('Error checking overdue checkups:', error);
  }
};

// Create and send checkup reminder
const createCheckupReminder = async (healthRecord, days, type) => {
  const user = healthRecord.userId;
  
  let title, message;
  
  if (type === 'upcoming') {
    title = `Checkup Reminder - ${days} day${days > 1 ? 's' : ''} to go`;
    message = `Hello ${user.name}, your follow-up checkup is scheduled in ${days} day${days > 1 ? 's' : ''}. Reason: ${healthRecord.recommendations.followUp.reason || 'Regular checkup'}. Please don't miss your appointment.`;
  } else {
    title = `Overdue Checkup - ${days} day${days > 1 ? 's' : ''} overdue`;
    message = `Hello ${user.name}, your checkup was scheduled ${days} day${days > 1 ? 's' : ''} ago and is now overdue. Reason: ${healthRecord.recommendations.followUp.reason || 'Regular checkup'}. Please schedule your appointment as soon as possible.`;
  }

  try {
    // Create reminder record
    const reminder = new Reminder({
      userId: user._id,
      type: 'checkup',
      title,
      message,
      scheduledDate: new Date(),
      reminderMethods: {
        sms: user.preferences?.notifications?.sms !== false,
        voice: user.preferences?.notifications?.voice !== false
      },
      metadata: {
        healthRecordId: healthRecord._id,
        checkupType: type,
        originalDate: healthRecord.recommendations.followUp.date
      }
    });

    await reminder.save();

    // Send SMS if enabled
    if (user.preferences?.notifications?.sms !== false) {
      const smsSuccess = await sendSMSReminder(user.phone, message);
      if (smsSuccess) {
        reminder.status = 'sent';
        reminder.sentAt = new Date();
      }
    }

    // Send voice call if enabled and it's overdue
    if (type === 'overdue' && user.preferences?.notifications?.voice !== false) {
      const voiceSuccess = await makeVoiceCall(user.phone, message);
      if (voiceSuccess) {
        reminder.status = 'sent';
        reminder.sentAt = new Date();
      }
    }

    await reminder.save();
    
    logger.info(`Checkup reminder sent to ${user.phone}: ${title}`);
  } catch (error) {
    logger.error(`Failed to send checkup reminder to ${user.phone}:`, error);
  }
};

// Manual function to send immediate checkup reminder
const sendImmediateCheckupReminder = async (userId, message) => {
  try {
    const user = await require('../models/User').findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const reminder = new Reminder({
      userId: user._id,
      type: 'checkup',
      title: 'Checkup Reminder',
      message,
      scheduledDate: new Date(),
      reminderMethods: {
        sms: true,
        voice: false
      }
    });

    await reminder.save();

    const smsSuccess = await sendSMSReminder(user.phone, message);
    
    if (smsSuccess) {
      reminder.status = 'sent';
      reminder.sentAt = new Date();
      await reminder.save();
    }

    return smsSuccess;
  } catch (error) {
    logger.error('Failed to send immediate checkup reminder:', error);
    return false;
  }
};

module.exports = {
  startCheckupReminderSystem,
  checkUpcomingCheckups,
  checkOverdueCheckups,
  sendImmediateCheckupReminder
};