const {addEmergency, getAllEmergencies,getById, updateStatus} = require('../controllers/emergency')
const router = require("express").Router();

router.post("/addemg/", addEmergency);
router.get("/getemg/", getAllEmergencies);
router.get("/getId/:id",getById)
router.put("/updateemg/:id", updateStatus)

module.exports = router;
