const {addEmergency, getAllEmergencies, updateStatus} = require('../controllers/emergency')
const router = require("express").Router();

router.post("/addemg/", addEmergency);
router.get("/getemg/", getAllEmergencies);
router.put("/updateemg/:id", updateStatus)

module.exports = router;
