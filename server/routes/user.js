const {

    getEMPProfile,
    getAllUsers,
    setAvatar,
    logOut,
    verifyToken,
    updateEMPProfile,
    updateAvailability,
    empApplication,
    getAvailability,
    approveApplication
  } = require("../controllers/userController");
  
  const router = require("express").Router();
  

  router.get("/emp-profile/:id",verifyToken, getEMPProfile);
  router.get('/api/chats/', verifyToken, getAllUsers)
  router.get('/apply',verifyToken, empApplication)
  router.put("/update-profile/:id", verifyToken, updateEMPProfile)
  router.patch("/update-availability/:id", verifyToken, updateAvailability)
  router.get("/availability/:id", verifyToken, getAvailability)
  router.put('/approve-application/:id', verifyToken, approveApplication)
  router.get('/get-applications')

  
  module.exports = router;
  