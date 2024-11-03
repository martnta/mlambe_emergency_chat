const {
  getAllApplications,
    getEMPProfile,
    getAllUsers,
    setAvatar,
    logOut,
    getEMPPerformance,
    verifyToken,
    updateEMPProfile,
    updateAvailability,
    empApplication,
    getAvailability,
    approveApplication
  } = require("../controllers/userController");
  
  const router = require("express").Router();
  

  router.get("/emp-profile/:id",verifyToken, getEMPProfile);
  router.get('/chats/:id',  getAllUsers)
  router.get('/emps', verifyToken, getAllUsers)
  router.get('/apply',verifyToken, empApplication)
  router.get('/apply/:id', verifyToken)
  router.put("/update-profile/:id", verifyToken, updateEMPProfile)
  router.patch("/update-availability/:id", verifyToken, updateAvailability)
  router.get("/availability/:id", verifyToken, getAvailability)
  router.put('/approve-application/:id', verifyToken, approveApplication)
  router.get('/get-applications', getAllApplications)
  router.get("/performance/:id", verifyToken, getEMPPerformance);

  
  module.exports = router;
  