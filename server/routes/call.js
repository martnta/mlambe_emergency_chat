
const { updateAvailability, initiateCall, } = require('../controllers/twilioController');

const router = require("express").Router();

router.post('/availability', updateAvailability);
router.post('/initiate-call', initiateCall);

module.exports = router