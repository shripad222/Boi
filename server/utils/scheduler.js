const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const { sendSMSReminder, makeVoiceCall } = require('./twilio');
const logger = require('./logger');

// Start the reminder scheduler
const startReminderScheduler = () => {
  // Run every minute to check for pending reminders
  cron.schedule('* * * * *', async () => {
    try {
      await processReminders();
    } catch (error) {
      logger.error('Scheduler error:', error);
    }
  });

  logger.info('Reminder scheduler started');
};

// Process pending reminders
const processReminders = async () => {
  const now = new Date();
  
  // Find reminders that are due
  const dueReminders = await Reminder.find({
    scheduledDate: { $lte: now },
    status: 'pending',
    attempts: { $lt: 3 } // Max 3 attempts
  }).populate('userId', 'phone preferences name');

  for (const reminder of dueReminders) {
    try {
      await sendReminder(reminder);
    } catch (error) {
      logger.error(`Failed to send reminder ${reminder._id}:`, error);
      
      // Update reminder with failed attempt
      reminder.attempts += 1;
      reminder.lastAttempt = new Date();
      
      if (reminder.attempts >= 3) {
        reminder.status = 'failed';
      }
      
      await reminder.save();
    }
  }
};

// Send individual reminder
const sendReminder = async (reminder) => {
  const user = reminder.userId;
  let success = false;

  // Send SMS if enabled
  if (reminder.reminderMethods.sms && user.preferences.notifications.sms) {
    success = await sendSMSReminder(user.phone, reminder.message);
  }

  // Send voice call if enabled
  if (reminder.reminderMethods.voice && user.preferences.notifications.voice) {
    const voiceMessage = `Hello ${user.name}, this is a reminder from Smart Health Rural Connect. ${reminder.message}`;
    success = await makeVoiceCall(user.phone, voiceMessage) || success;
  }

  // Update reminder status
  if (success) {
    reminder.status = 'sent';
    reminder.sentAt = new Date();
    logger.info(`Reminder sent successfully to ${user.phone}: ${reminder.title}`);
  } else {
    reminder.attempts += 1;
    reminder.lastAttempt = new Date();
    
    if (reminder.attempts >= 3) {
      reminder.status = 'failed';
      logger.error(`Failed to send reminder after 3 attempts: ${reminder._id}`);
    }
  }

  await reminder.save();

  // Handle recurring reminders
  if (reminder.recurring.enabled && reminder.status === 'sent') {
    await createRecurringReminder(reminder);
  }
};

// Create next occurrence of recurring reminder
const createRecurringReminder = async (originalReminder) => {
  const nextDate = calculateNextReminderDate(
    originalReminder.scheduledDate,
    originalReminder.recurring.frequency,
    originalReminder.recurring.interval
  );

  // Check if we haven't exceeded the end date
  if (originalReminder.recurring.endDate && nextDate > originalReminder.recurring.endDate) {
    return;
  }

  const nextReminder = new Reminder({
    userId: originalReminder.userId,
    type: originalReminder.type,
    title: originalReminder.title,
    message: originalReminder.message,
    scheduledDate: nextDate,
    reminderMethods: originalReminder.reminderMethods,
    recurring: originalReminder.recurring,
    metadata: originalReminder.metadata
  });

  await nextReminder.save();
  logger.info(`Created recurring reminder for ${nextDate}`);
};

// Calculate next reminder date based on frequency
const calculateNextReminderDate = (currentDate, frequency, interval = 1) => {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * interval));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;
  }

  return nextDate;
};

// Clean up old reminders (run daily)
cron.schedule('0 2 * * *', async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Reminder.deleteMany({
      status: { $in: ['sent', 'failed'] },
      updatedAt: { $lt: thirtyDaysAgo }
    });

    logger.info(`Cleaned up ${result.deletedCount} old reminders`);
  } catch (error) {
    logger.error('Failed to clean up old reminders:', error);
  }
});

module.exports = {
  startReminderScheduler,
  processReminders
};