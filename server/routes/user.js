const {
    login,
    register,
    getEMPProfile: getAllUsers,
    setAvatar,
    logOut,
    verifyToken,
    updateEMPProfile,
    updateAvailability,
    getAvailability
  } = require("../controllers/userController");
  
  const router = require("express").Router();
  

  router.get("/emp-profile/:id",verifyToken, getAllUsers);
  router.put("/update-profile/:id", verifyToken, updateEMPProfile)
  router.patch("/update-availability/:id", verifyToken, updateAvailability)
  router.get("/availability/:id", verifyToken, getAvailability)

  
  module.exports = router;
  