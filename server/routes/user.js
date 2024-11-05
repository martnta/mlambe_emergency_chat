const {
  getAllApplications,
    getEMPProfile,
    getApplicationDetailsById,
    getAllUsers,
    setAvatar,
    logOut,
    getAllEmployees,
    getEMPPerformance,
    verifyToken,
    updateEMPProfile,
    updateAvailability,
    empApplication,
    getAvailability,
    getEMPById,
    approveApplication,
    getApplicationDetails,
    getApplicationStats
  } = require("../controllers/userController");
  
  const router = require("express").Router();
  

  router.get("/emp-profile/:id",verifyToken, getEMPProfile);
  router.get('/emps/:id', verifyToken,getEMPById)
  router.get('/chats/:id',  getAllUsers)
  router.get('/emps', verifyToken, getAllEmployees)
  router.get('/apply',verifyToken, empApplication)
  router.get('/apply/:id', verifyToken, getApplicationDetailsById)
  router.put("/update-profile/:id", verifyToken, updateEMPProfile)
  router.patch("/update-availability/:id", verifyToken, updateAvailability)
  router.get("/availability/:id", verifyToken, getAvailability)
  router.put('/approve-application/:id', verifyToken, approveApplication)
  router.get('/get-applications',  getApplicationDetails);
  router.get('/application-stats' , verifyToken, getApplicationStats)
  router.get("/performance/:id", verifyToken, getEMPPerformance);

  
  module.exports = router;
  