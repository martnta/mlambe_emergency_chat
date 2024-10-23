const EMPAvailability = require('../models/empAvailabilityModel');
const User = require('../models/userModel');
const twilio = require('twilio');

// Twilio configuration - added validation
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN; // Added auth token for main client
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

// Validate Twilio credentials
if (!accountSid || !authToken) {
  console.error('Missing required Twilio credentials');
  process.exit(1);
}

// Initialize main Twilio client
const twilioClient = twilio(accountSid, authToken);

// Parse options if provided
const options = process.env.TWILIO_OPTIONS 
  ? JSON.parse(process.env.TWILIO_OPTIONS) 
  : {};

// Update EMP availability status
const updateAvailability = async (req, res) => {
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

// Initiate a call with an available EMP
const initiateCall = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Find the least recently updated available EMP
    const availableEMP = await EMPAvailability.findOne({ isAvailable: true })
      .sort({ lastUpdated: 1 })
      .populate('empId');

    if (!availableEMP) {
      return res.status(404).json({ error: 'No available EMPs' });
    }

    // Generate unique room name
    const roomName = `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate API key credentials for token generation
    if (!apiKeySid || !apiKeySecret) {
      throw new Error('Missing Twilio API key credentials');
    }

    // Create Access Token
    const accessToken = new twilio.jwt.AccessToken(
      accountSid,
      apiKeySid,
      apiKeySecret,
      {
        identity: userId.toString(), // Ensure identity is a string
        ttl: 3600 // Token expires in 1 hour
      }
    );

    // Create Video grant
    const videoGrant = new twilio.jwt.AccessToken.VideoGrant({
      room: roomName
    });

    // Add grant to token
    accessToken.addGrant(videoGrant);

    // Update EMP availability status
    await EMPAvailability.findOneAndUpdate(
      { empId: availableEMP.empId },
      {
        isAvailable: false,
        lastUpdated: new Date()
      }
    );

    // Return call details
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

// Add function to validate room existence
const validateRoom = async (roomName) => {
  try {
    const room = await twilioClient.video.rooms(roomName).fetch();
    return room.uniqueName === roomName;
  } catch (error) {
    return false;
  }
};

module.exports = {
  updateAvailability,
  initiateCall,
  validateRoom
};