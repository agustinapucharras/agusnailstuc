const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true 
  }, // Format "YYYY-MM-DD"
  
  time: { 
    type: String, 
    required: true 
  }, // Format "HH:mm" (e.g., "08:05")

  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Client', 
    required: true 
  },

  // Student reference
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student',
    required: true 
  },

  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true 
  },

  status: { 
    type: String, 
    enum: ['pendiente', 'confirmado', 'cancelado', 'asistio'],
    default: 'confirmado'
  },

  // Notification Log
  notificationSent: {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false }
  },
  
  // Audit Trail
  audit: {
    sourceIp: { type: String },
    userAgent: { type: String },
    platform: { type: String }
  }
}, { 
  timestamps: true 
});

// GOLDEN RULE: Prevent overbooking for the SAME SERVICE
// One slot can only have one appointment at a time (cancelled appointments are reused via UPDATE)
appointmentSchema.index({ date: 1, time: 1, service: 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
