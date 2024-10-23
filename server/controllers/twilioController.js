const twilio = require('twilio');
const EMPAvailability = require('../models/empAvailabilityModel');

require('dotenv').config();
const Emergency = require('../models/emergencyModel');

const twilioConfig = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    apiKeySecret: process.env.TWILIO_API_KEY_SECRET,
    apiKeyVideoSecret: process.env.TWILIO_API_KEY_VIDEO_SECRET,
    smsServiceSid: process.env.TWILIO_SMS_SERVICE_SID,
    videoServiceSid: process.env.TWILIO_VIDEO_SERVICE_SID
  };

// Validate Twilio credentials
if (!twilioConfig.accountSid || !twilioConfig.authToken) {
    console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID);
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN);
console.log('TWILIO_API_KEY_SECRET:', process.env.TWILIO_API_KEY_SECRET);
  console.error('Missing required Twilio credentials');
  process.exit(1);
}

const twilioClient = twilio(twilioConfig.accountSid, twilioConfig.authToken);

module.exports.updateAvailability = async (req, res) => {
  const { empId, isAvailable } = req.body;

  if (!empId || typeof isAvailable !== 'boolean') {
    return res.status(400).json({ error: 'Invalid input parameters' });
  }

  try {
    const availability = await EMPAvailability.findOneAndUpdate(
      { empId },
      {
        isAvailable,
        lastUpdated: new Date()
      },
      {
        new: true,
        upsert: true
      }
    );

    res.status(200).json(availability);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({
      error: 'Failed to update availability',
      details: error.message
    });
  }
};

module.exports.initiateCall = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const availableEMP = await EMPAvailability.findOne({ isAvailable: true })
      .sort({ lastUpdated: 1 })
      .populate('empId');

    if (!availableEMP) {
      return res.status(404).json({ error: 'No available EMPs' });
    }

    const roomName = `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!twilioConfig.apiKeySid || !twilioConfig.apiKeySecret) {
      throw new Error('Missing Twilio API key credentials');
    }

    const accessToken = new twilio.jwt.AccessToken(
      twilioConfig.accountSid,
      twilioConfig.apiKeySid,
      twilioConfig.apiKeySecret,
      {
        identity: userId.toString(),
        ttl: 3600
      }
    );

    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: roomName
    });

    accessToken.addGrant(videoGrant);

    await EMPAvailability.findOneAndUpdate(
      { empId: availableEMP.empId },
      {
        isAvailable: false,
        lastUpdated: new Date()
      }
    );

    res.status(200).json({
      empId: availableEMP.empId,
      roomName,
      token: accessToken.toJwt()
    });

  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({
      error: 'Failed to initiate call',
      details: error.message
    });
  }
};

module.exports.validateRoom = async (roomName) => {
  try {
    const room = await twilioClient.video.rooms(roomName).fetch();
    return room.uniqueName === roomName;
  } catch (error) {
    return false;
  }
};

module.exports.sendNotification = async (req, res, next) => {
  try {
    const { emergencyId, status } = req.body;

    const emergency = await Emergency.findById(emergencyId);

    if (!emergency) {
      return res.status(404).json({ msg: 'Emergency not found' });
    }

    const message = await twilioClient.messages.create({
      body: `Your emergency request status has been updated to: ${status}`,
      messagingServiceSid: twilioConfig.smsServiceSid,
      to: emergency.phone
    });

    console.log('SMS sent successfully:', message.sid);
    res.status(200).json({ msg: 'Notification sent successfully', messageSid: message.sid });
  } catch (error) {
    next(error);
  }
};

module.exports.createVideoRoom = async (req, res) => {
  const { roomName } = req.body;

  try {
    const room = await twilioClient.video.rooms.create({
      uniqueName: roomName,
      type: 'group',
    });

    res.json({ success: true, roomSid: room.sid });
  } catch (error) {
    console.error('Error creating video room:', error);
    res.status(500).json({ success: false, error: 'Failed to create video room' });
  }
};

module.exports.generateVideoToken = async (req, res) => {
  const { identity, roomName } = req.body;

  try {
    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: roomName,
    });

    const token = new twilio.jwt.AccessToken(
      twilioConfig.accountSid,
      twilioConfig.apiKeySid,
      twilioConfig.apiKeySecret,
      { identity: identity }
    );

    token.addGrant(videoGrant);

    res.json({ success: true, token: token.toJwt() });
  } catch (error) {
    console.error('Error generating video token:', error);
    res.status(500).json({ success: false, error: 'Failed to generate video token' });
  }
};

