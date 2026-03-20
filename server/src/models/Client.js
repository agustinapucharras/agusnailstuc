const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: true 
  }, 
  dni: { 
    type: String, 
    required: true, 
    unique: true 
  }, 
  email: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String, 
    required: true 
  },
  lastAppointment: { 
    type: Date 
  },
  audit: {
    ip: String,
    userAgent: String
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Client', clientSchema);
