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

router.post("/login", login);
router.post("/register", register);
router.get("/emp-profile/:id",verifyToken, getAllUsers);
router.put('/update-profile:id', verifyToken, updateEMPProfile)
router.put('/update-availability:id', verifyToken, updateAvailability)
router.get('/availability:id', verifyToken, getAvailability)
router.post("/setavatar/:id",verifyToken, setAvatar);
router.get("/logout/:id",verifyToken, logOut);

module.exports = router;
