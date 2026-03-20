const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  dni: { 
    type: String, 
    required: true,
    unique: true
  },
  // Optional: Link to Tutor (Client) if we want to query students by tutor later
  tutor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  audit: {
    ip: String,
    userAgent: String
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Student', studentSchema);
