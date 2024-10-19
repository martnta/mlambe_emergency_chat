const Emergency = require('../models/emergencyModel')

module.exports.getAllEmergencies = async (req, res, next) => {
    try {
      const emergencies = await Emergency.find({ _id: { $ne: req.params.id } }).select([
      
        "type",
        "createdAt",
        "name",
        "email",
        "status",
        "latitude",
        "longitude",
        "_id",
      ]);
      return res.json(emergencies);
    } catch (ex) {
      next(ex);
    }
  };


//udating status
  module.exports.updateStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      const emergency = await Emergency.findByIdAndUpdate(req.params.id, { status }, { new: true });
  
      if (!emergency) {
        return res.status(404).json({ msg: 'Emergency not found' });
      }
  
      return res.json({ msg: 'Emergency status updated successfully' });
    } catch (ex) {
      next(ex);
    }
  };
  

  ///get by id
  module.exports.getById = async (req, res, next) => {
    try {
      const { status } = req.body;
      const emergency = await Emergency.findById(req.params.id, { status }, { new: true });
  
      if (!emergency) {
        return res.status(404).json({ msg: 'Emergency not found' });
      }
  
      return res.json({ msg: 'Emergency found successfully' });
    } catch (ex) {
      next(ex);
    }
  };

//sending emergency  

module.exports.addEmergency = async (req, res, next) => {
  try {
    const { type, name, email,status,latitude, longitude} = req.body;
    const data = await Emergency.create({
        type,
        name,
        email,
        status,
        latitude,
        longitude
    });

    if (data) return res.json({ msg: "Emergency added successfully." });
    else return res.json({ msg: "Failed to add emergency to the database" });
  } catch (ex) {
    next(ex);
  }
};
