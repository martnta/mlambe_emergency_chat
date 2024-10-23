const mongoose = require("mongoose");

const EmergencySchema = mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  phone: {type:String, required: true},
  email: { type: String, required: true },
  status: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
}, {
  timestamps: true,
});

module.exports = mongoose.model("emergency", EmergencySchema);
