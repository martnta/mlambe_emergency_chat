const Users = require("../models/userModel");
const EMPAvailability = require('../models/empAvailabilityModel')
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validateSpecialization, validateCertifications, validateExperience, validateAvailabilityStatus } = require('../validatots/applicationValidators');


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

//get all chats
module.exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await Users.find({ _id: req.params.id, }).select([
      "email",
      "username",
      "avatarImage",
      "_id",
    ]);
    return res.json(users);
  } catch (ex) {
    next(ex);
  }
};

// Get a specific EMP by ID
module.exports.getEMPById = async (req, res, next) => {
  try {
    const emp = await Users.findById(req.params.id).select([
      "email",
      "username",
      "avatarImage",
      "phone",
      "lastActive",
      "successRate",
      "responseTime",
      "createdAt",
      "availabilityStatus",
    ]);

    if (!emp) {
      return res.status(404).json({ message: "EMP not found" });
    }

    return res.json(emp);
  } catch (ex) {
    next(ex);
  }
};




module.exports.getAllEmployees = async (req, res) => {
  try {
    const {
      specialization,
      availabilityStatus,
      sortBy,
      limit = 10,
      page = 1
    } = req.query;

    // Base query to get only users with role "emp"
    let query = { role: "emp" };

    // Add filters if provided
    if (specialization) {
      query.specialization = specialization;
    }
    if (availabilityStatus) {
      query.availabilityStatus = availabilityStatus;
    }

    // Create base query
    let employeesQuery = Users.find(query);

    // Add sorting if provided
    const sortOptions = {
      performance: { successRate: -1 },
      responseTime: { responseTime: 1 },
      completedEmergencies: { completedEmergencies: -1 },
      default: { createdAt: -1 }
    };

    employeesQuery = employeesQuery.sort(sortOptions[sortBy] || sortOptions.default);

    // Select fields needed for the dashboard
    employeesQuery = employeesQuery.select(`
      username
      email
      specialization
      yearsOfExperience
      assignedEmergencies
      completedEmergencies
      responseTime
      successRate
      certifications
      availabilityStatus
      lastActive
      location
    `);

    // Add pagination
    const skip = (page - 1) * limit;
    employeesQuery = employeesQuery.skip(skip).limit(parseInt(limit));

    // Execute queries
    const [employees, total] = await Promise.all([
      employeesQuery.exec(),
      Users.countDocuments(query)
    ]);

    // Process the data to match frontend requirements
    const formattedEmployees = employees.map(emp => ({
      id: emp._id,
      username: emp.username,
      email: emp.email,
      specialization: emp.specialization,
      yearsOfExperience: emp.yearsOfExperience,
      assignedEmergencies: emp.assignedEmergencies,
      completedEmergencies: emp.completedEmergencies,
      responseTime: parseFloat(emp.responseTime?.replace(' mins', '') || '0'),
      successRate: parseFloat(emp.successRate?.replace('%', '') || '0'),
      certifications: emp.certifications,
      availabilityStatus: emp.availabilityStatus,
      lastActive: emp.lastActive,
      location: emp.location,
      // Calculate active emergencies
      activeEmergencies: emp.assignedEmergencies - emp.completedEmergencies
    }));

    // Calculate dashboard metrics
    const totalEMPs = formattedEmployees.length;
    const activeEMPs = formattedEmployees.filter(emp => 
      emp.availabilityStatus === 'Available' || emp.availabilityStatus === 'On Call'
    ).length;
    const avgPerformance = totalEMPs 
      ? formattedEmployees.reduce((sum, emp) => sum + emp.successRate, 0) / totalEMPs 
      : 0;
    const avgResponseTime = totalEMPs
      ? formattedEmployees.reduce((sum, emp) => sum + emp.responseTime, 0) / totalEMPs
      : 0;

    // Return response with dashboard metrics
    return res.status(200).json({
      success: true,
      metrics: {
        totalEMPs,
        activeEMPs,
        avgPerformance,
        avgResponseTime
      },
      pagination: {
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalEmployees: total,
      },
      data: formattedEmployees
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error retrieving employees",
      error: error.message
    });
  }
};

// register
module.exports.registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Check existing username
    if (await Users.findOne({ username })) {
      return res.json({ msg: "Username already used", status: false, field: "username" });
    }

    // Check existing email
    if (await Users.findOne({ email })) {
      return res.json({ msg: "Email already used", status: false, field: "email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create initial user
    const user = await Users.create({
      username,
      email,
      password: hashedPassword,
      role: 'applicant', 
      createdAt: new Date(),
    });

    return res.json({ status: true, userId: user._id, msg: "User registered successfully" });

  } catch (error) {
    console.error('User registration error:', error);
    next(error);
  }
};

//application
module.exports.empApplication = async (req, res, next) => {
  try {
    const { userId, specialization, yearsOfExperience, certifications, availabilityStatus } = req.body;

    // Find the user by ID
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found", status: false });
    }

    // Perform application-specific validations
    const validationErrors = validateApplicationData(req.body);
    if (validationErrors.length) {
      return res.status(400).json({ status: false, msg: "Validation errors", errors: validationErrors });
    }

    // Update user with application details
    user.specialization = specialization;
    user.yearsOfExperience = yearsOfExperience;
    user.certifications = certifications;
    user.availabilityStatus = availabilityStatus || 'Off Duty';
    user.assignedEmergencies = 0;
    user.completedEmergencies = 0;
    user.responseTime = 'N/A';
    user.successRate = 'N/A';
    user.lastActive = new Date();

    await user.save();

    // Generate token
    const token = generateAuthToken(user);

    // Remove password before sending response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res.json({ status: true, user: userWithoutPassword, token, msg: "Application sent successfully" });

  } catch (error) {
    console.error('Application Submit error:', error);
    next(error);
  }
};


// get all applications 
module.exports.getAllApplications = async (req, res, next) => {
  try {
    // Fetch all users with the role of "Applicant"
    const applicants = await Users.find({ role: 'Applicant'  }).select('-password');

    if (!applicants.length) {
      return res.status(404).json({ msg: "No applications found", status: false });
    }

    return res.json({
      status: true,
      applicants,
      msg: "Applications retrieved successfully",
    });

  } catch (error) {
    console.error('Error retrieving applications:', error);
    next(error);
  }
};

// approve application 
module.exports.approveApplication = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find the user by ID
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found", status: false });
    }

    // Update role to "EMP" to approve application
    user.role = 'emp';
    await user.save();

    // Remove password before sending response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return res.json({
      status: true,
      user: userWithoutPassword,
      msg: "Application approved successfully",
    });

  } catch (error) {
    console.error('Application approval error:', error);
    next(error);
  }
};


module.exports.getApplicationDetailsById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await Users.findById(id)
      .select([
        'username',
        'email',
        'avatarImage',
        'specialization',
        'yearsOfExperience',
        'certifications',
        'role',
        'createdAt',
        'availabilityStatus'
      ]);

    if (!application) {
      return res.status(404).json({
        status: false,
        message: 'Application not found'
      });
    }

    const applicationStatus = application.specialization ? 'pending' : 'incomplete';
    const completeness = calculateApplicationCompleteness(application);

    const applicationDetails = {
      id: application._id,
      username: application.username,
      email: application.email,
      avatarImage: application.avatarImage,
      specialization: application.specialization || 'Not specified',
      yearsOfExperience: application.yearsOfExperience || 0,
      certifications: application.certifications || [],
      availabilityStatus: application.availabilityStatus,
      status: applicationStatus,
      completeness: completeness,
      role: application.role,
      submittedAt: application.createdAt
    };

    return res.json({
      status: true,
      data: applicationDetails,
      message: "Application details retrieved successfully"
    });

  } catch (error) {
    console.error('Error fetching application details:', error);
    next(error);
  }
};

function calculateApplicationCompleteness(application) {
  // Calculate the completeness of the application based on the available information
  let completeness = 0;

  // Check if the username is provided
  if (application.username) {
    completeness += 20;
  }

  // Check if the email is provided
  if (application.email) {
    completeness += 20;
  }

  // Check if the avatar image is provided
  if (application.avatarImage) {
    completeness += 10;
  }

  // Check if the specialization is provided
  if (application.specialization) {
    completeness += 20;
  }

  // Check if the years of experience is provided
  if (application.yearsOfExperience) {
    completeness += 10;
  }

  // Check if the certifications are provided
  if (application.certifications.length > 0) {
    completeness += 20;
  }

  return completeness;
}
module.exports.getApplicationDetails = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { role: 'applicant' };

    // Add filters based on query parameters
    if (status === 'pending') {
      query.specialization = { $exists: true }; 
    }

    const applications = await Users.find(query)
      .select([
        'username',
        'email',
        'avatarImage',
        'specialization',
        'yearsOfExperience',
        'certifications',
        'role',
        'createdAt',
        'availabilityStatus'
      ])
      .sort({ createdAt: -1 }); // Latest applications first

    // Transform the data to include additional application status information
    const transformedApplications = applications.map(app => {
      const applicationStatus = app.specialization ? 'pending' : 'incomplete';
      const completeness = calculateApplicationCompleteness(app);

      return {
        id: app._id,
        username: app.username,
        email: app.email,
        avatarImage: app.avatarImage,
        specialization: app.specialization || 'Not specified',
        yearsOfExperience: app.yearsOfExperience || 0,
        certifications: app.certifications || [],
        availabilityStatus: app.availabilityStatus,
        status: applicationStatus,
        completeness: completeness,
        role: app.role,
        submittedAt: app.createdAt,
      };
    });

    return res.json({
      status: true,
      data: transformedApplications,
      totalCount: transformedApplications.length,
      message: "Applications retrieved successfully"
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    next(error);
  }
};

// Helper function to calculate application completeness
function calculateApplicationCompleteness(application) {
  const requiredFields = [
    'specialization',
    'yearsOfExperience',
    'certifications',
    'availabilityStatus'
  ];
  
  const completedFields = requiredFields.filter(field => {
    if (Array.isArray(application[field])) {
      return application[field].length > 0;
    }
    return application[field] != null && application[field] !== '';
  });

  return Math.round((completedFields.length / requiredFields.length) * 100);
}

// Get application statistics
module.exports.getApplicationStats = async (req, res, next) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

    // Get total applications
    const totalApplications = await Users.countDocuments({ 
      role: 'applicant',
      specialization: { $exists: true }
    });

    // Get applications in last 30 days
    const recentApplications = await Users.countDocuments({
      role: 'applicant',
      specialization: { $exists: true },
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get applications by specialization
    const specializationStats = await Users.aggregate([
      {
        $match: {
          role: 'applicant',
          specialization: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average years of experience
    const experienceStats = await Users.aggregate([
      {
        $match: {
          role: 'applicant',
          yearsOfExperience: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          averageExperience: { $avg: '$yearsOfExperience' }
        }
      }
    ]);

    return res.json({
      status: true,
      data: {
        totalApplications,
        recentApplications,
        specializationBreakdown: specializationStats,
        averageExperience: experienceStats[0]?.averageExperience || 0
      }
    });

  } catch (error) {
    console.error('Error fetching application stats:', error);
    next(error);
  }
};
// Helper controller to update response metrics
// Add this to your existing controller file

module.exports.getEMPPerformance = async (req, res, next) => {
  try {
    const empId = req.params.id;

    // Find the EMP by ID and ensure they have the 'emp' role
    const emp = await Users.findOne({ 
      _id: empId,
      role: 'emp'
    }).select([
      'assignedEmergencies',
      'completedEmergencies',
      'responseTime',
      'successRate',
      'lastActive'
    ]);

    if (!emp) {
      return res.status(404).json({
        status: false,
        msg: "EMP not found"
      });
    }

    // Calculate performance metrics
    const activeEmergencies = emp.assignedEmergencies - emp.completedEmergencies;
    const completionRate = emp.assignedEmergencies > 0 
      ? ((emp.completedEmergencies / emp.assignedEmergencies) * 100).toFixed(1)
      : '0.0';
    
    // Parse response time from string (removes ' mins' suffix)
    const avgResponseTime = emp.responseTime !== 'N/A' 
      ? parseFloat(emp.responseTime.split(' ')[0])
      : 0;

    // Parse success rate from string (removes '%' suffix)
    const successRate = emp.successRate !== 'N/A'
      ? parseFloat(emp.successRate)
      : 0;

    // Calculate overall performance score (weighted average)
    const weights = {
      completionRate: 0.3,
      responseTime: 0.3,
      successRate: 0.4
    };

    // Response time score (lower is better, max 60 mins)
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime * (100/60)));

    const performanceScore = Math.round(
      (parseFloat(completionRate) * weights.completionRate) +
      (responseTimeScore * weights.responseTime) +
      (successRate * weights.successRate)
    );

    return res.json({
      status: true,
      data: {
        performanceScore,
        responseTime: avgResponseTime,
        activeEmergencies,
        completedEmergencies: emp.completedEmergencies,
        totalEmergencies: emp.assignedEmergencies,
        completionRate: `${completionRate}%`,
        successRate: emp.successRate,
        lastActive: emp.lastActive
      }
    });

  } catch (ex) {
    console.error('Error fetching EMP performance:', ex);
    next(ex);
  }
};

module.exports.updateMetrics = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { responseTimeInMins, wasSuccessful } = req.body;

    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        msg: "User not found"
      });
    }

    await user.updateMetrics(responseTimeInMins, wasSuccessful);

    return res.json({
      status: true,
      msg: "Metrics updated successfully"
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
      "role",
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


// update profile picture
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


//update emp availability
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

// get availbility
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

// Helper functions
function validateApplicationData(data) {
  const { specialization, yearsOfExperience, certifications, availabilityStatus } = data;
  const errors = [];

  // Validate specialization
  const specializationError = validateSpecialization(specialization);
  if (specializationError) errors.push({ field: "specialization", message: specializationError });

  // Validate years of experience
  const experienceError = validateExperience(yearsOfExperience);
  if (experienceError) errors.push({ field: "yearsOfExperience", message: experienceError });

  // Validate certifications
  const certificationsError = validateCertifications(certifications);
  if (certificationsError) errors.push({ field: "certifications", message: certificationsError });

  // Validate availability status
  const availabilityStatusError = validateAvailabilityStatus(availabilityStatus);
  if (availabilityStatusError) errors.push({ field: "availabilityStatus", message: availabilityStatusError });

  return errors;
}

function generateAuthToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" }
  );
}