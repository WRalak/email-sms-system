const cron    = require('node-cron');
const Message = require('../models/Message');
const User    = require('../models/User');
const { processMessage } = require('../controllers/messageController');

const schedulerInit = () => {
  // Run every minute – check for scheduled messages due to send
  cron.schedule('* * * * *', async () => {
    try {
      const due = await Message.find({
        status: 'scheduled',
        scheduledAt: { $lte: new Date() },
      });

      for (const message of due) {
        try {
          message.status = 'sending';
          await message.save();
          const user = await User.findById(message.owner);
          await processMessage(message, user);
          console.log(`[Scheduler] Sent scheduled message ${message._id}`);
        } catch (err) {
          message.status = 'failed';
          await message.save();
          console.error(`[Scheduler] Failed to send message ${message._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error checking scheduled messages:', err.message);
    }
  });

  console.log('⏰ Message scheduler started');
};

module.exports = { schedulerInit };
