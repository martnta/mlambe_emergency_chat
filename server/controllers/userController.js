const Users = require("../models/userModel");
const EMPAvailability = require('../models/empAvailabilityModel')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require('dotenv').config();


const JWT_SECRET = process.env.JWT_SECRET;

module.exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await Users.findOne({ username });
    
    if (!user)
      return res.json({ msg: "Incorrect Username or Password", status: false });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.json({ msg: "Incorrect Username or Password", status: false });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password from user object
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res.json({
      status: true,
      user: userWithoutPassword,
      token
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    
    const usernameCheck = await Users.findOne({ username });
    if (usernameCheck)
      return res.json({ msg: "Username already used", status: false });
    
    const emailCheck = await Users.findOne({ email });
    if (emailCheck)
      return res.json({ msg: "Email already used", status: false });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await Users.create({
      email,
      username,
      password: hashedPassword,
    });

    // Generate token for newly registered user
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Remove password from user object
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res.json({
      status: true,
      user: userWithoutPassword,
      token
    });
  } catch (ex) {
    next(ex);
  }
};

// Middleware to verify token
module.exports.verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from Bearer token
    
    if (!token) {
      return res.status(401).json({ 
        status: false,
        msg: "Access denied. No token provided." 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(400).json({ 
      status: false,
      msg: "Invalid token." 
    });
  }
};

//get EMP profile
module.exports.getEMPProfile = async (req, res, next) => {
  try {
    // Find single EMP by ID and role
    const emp = await Users.findOne({ 
      _id: req.params.id,
      role: 'emp'
    }).select([
      "username",
      "avatarImage", 
      "email",
      "specialization",
      "yearsOfExperience",
      "assignedEmergencies",
      "completedEmergencies",
      "availabilityStatus",
      "responseTime",
      "successRate",
      "certifications",
      "location",
      "lastActive"
    ]);

    if (!emp) {
      return res.status(404).json({ 
        status: false, 
        message: "EMP profile not found" 
      });
    }

    return res.json({ 
      status: true, 
      data: emp 
    });

  } catch (ex) {
    next(ex);
  }
};


module.exports.setAvatar = async (req, res, next) => {
  try {
    const userId = req.params.id;
    // Verify that the requesting user matches the user ID being modified
    if (req.user.userId !== userId) {
      return res.status(403).json({
        status: false,
        msg: "Unauthorized to modify this user's avatar"
      });
    }

    const avatarImage = req.body.image;
    const userData = await Users.findByIdAndUpdate(
      userId,
      {
        isAvatarImageSet: true,
        avatarImage,
      },
      { new: true }
    );
    return res.json({
      isSet: userData.isAvatarImageSet,
      image: userData.avatarImage,
    });
  } catch (ex) {
    next(ex);
  }
};


module.exports.updateAvailability = async (req, res, next) => {
  try {
    const empId = req.params.id;
    
    // Verify that the requesting user matches the user ID being modified
    if (req.user._id.toString() !== empId) {
      return res.status(403).json({
        status: false,
        msg: "Unauthorized to modify this EMP's profile"
      });
    }

    // Find the EMP's availability record to be updated
    const emp = await EMPAvailability.findOne({ empId });
    
    if (!emp) {
      return res.status(404).json({
        status: false,
        msg: "EMP availability profile not found"
      });
    }

    // Destructure the fields that can be updated from the request body
    const { availabilityStatus } = req.body;

    // Update the availability if it's provided in the request
    if (availabilityStatus !== undefined) {
      emp.isAvailable = availabilityStatus;
    }

    // Save the updated EMP profile
    const updatedEMP = await emp.save();

    // Send the updated profile back as a response
    return res.json({
      status: true,
      emp: updatedEMP,
      msg: "EMP availability updated successfully"
    });
  } catch (ex) {
    next(ex);
  }
};


module.exports.getAvailability = async (req, res, next) => {
  try {
    // Fetch EMP availability excluding the current user by req.params.id
    const availabilities = await EMPAvailability.find({ empId: { $ne: req.params.id } })
      .populate('empId', 'username email avatarImage') 
      .select(['empId', 'isAvailable', 'lastUpdated']); 

    if (!availabilities) {
      return res.status(201).json({
        status: false,
        msg: "No EMP availability profiles found"
      });
    }

    // Return the fetched availability profiles
    return res.json({
      status: true,
      data: availabilities,
      msg: "EMP availability profiles fetched successfully"
    });
  } catch (ex) {
    next(ex);
  }
};

module.exports.updateEMPProfile = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Verify that the requesting user matches the user ID being modified
    if (req.user.userId !== userId) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized to modify this user's profile"
      });
    }

    // Find the user to be updated
    const user = await Users.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    // Ensure that only EMPs can update EMP-specific fields
    if (user.role !== 'emp') {
      return res.status(400).json({
        status: false,
        message: "Only EMPs can update this profile"
      });
    }

    // Destructure the fields that can be updated from the request body
    const { 
      specialization, 
      yearsOfExperience, 
      certifications, 
      availabilityStatus 
    } = req.body;

    // Create an update object with only the provided fields
    const updateFields = {};
    if (specialization !== undefined) updateFields.specialization = specialization;
    if (yearsOfExperience !== undefined) updateFields.yearsOfExperience = yearsOfExperience;
    if (certifications !== undefined) updateFields.certifications = certifications;
    if (availabilityStatus !== undefined) updateFields.availabilityStatus = availabilityStatus;

    // Add lastActive to update fields
    updateFields.lastActive = new Date();

    // Update the user with the new fields
    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    // Send the updated profile back as a response
    return res.json({
      status: true,
      data: updatedUser,
      message: "EMP profile updated successfully"
    });

  } catch (ex) {
    next(ex);
  }
};


module.exports.logOut = (req, res, next) => {
  try {
    if (!req.params.id) return res.json({ msg: "User id is required " });
    onlineUsers.delete(req.params.id);
    return res.status(200).send();
  } catch (ex) {
    next(ex);
  }
};