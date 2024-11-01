// validators/applicationValidators.js

const validSpecializations = [
    'Emergency Medicine',
    'Trauma',
    'Critical Care',
    'Pediatric Emergency',
    'Cardiac Emergency',
    'Disaster Response',
    'General Emergency'
  ];
  
  const validCertifications = [
    'Advanced Cardiac Life Support',
    'Pediatric Advanced Life Support',
    'Basic Life Support',
    'Advanced Trauma Life Support',
    'Emergency Medical Technician',
    'Paramedic Certification',
    'Crisis Intervention',
    'Hazardous Materials Certification'
  ];
  
  const validAvailabilityStatuses = ['Available', 'On Call', 'On Emergency', 'Off Duty', 'On Break'];
  
  // Validate specialization
  function validateSpecialization(specialization) {
    return validSpecializations.includes(specialization);
  }
  
  // Validate years of experience
  function validateExperience(yearsOfExperience) {
    return !isNaN(yearsOfExperience) && yearsOfExperience >= 0 && yearsOfExperience <= 50;
  }
  
  // Validate certifications
  function validateCertifications(certifications) {
    return Array.isArray(certifications) && certifications.every(cert => validCertifications.includes(cert));
  }
  
  // Validate availability status
  function validateAvailabilityStatus(availabilityStatus) {
    return validAvailabilityStatuses.includes(availabilityStatus);
  }
  
  module.exports = {
    validateSpecialization,
    validateExperience,
    validateCertifications,
    validateAvailabilityStatus
  };
  