const Emergency = require('../models/emergencyModel');
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

module.exports.sendNotification = async (req, res, next) => {
  try {
    const { emergencyId, status } = req.body;

    // Fetch the emergency details from your database
    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) {
      return res.status(404).json({ msg: 'Emergency not found' });
    }

    // Send SMS
    const message = await client.messages.create({
      body: `Your emergency request status has been updated to: ${status}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: emergency.phone // Assuming 'phone' field exists in your Emergency model
    });

    console.log('SMS sent successfully:', message.sid);
    res.status(200).json({ msg: 'Notification sent successfully', messageSid: message.sid });
  } catch (ex) {
    next(ex);
  }
};