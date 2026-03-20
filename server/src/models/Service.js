const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    default: "Matrícula 2026" 
  },
  duration: { 
    type: Number, 
    enum: [5, 15, 30, 45, 60, 120], // Duraciones permitidas en minutos
    default: 15, 
    required: true 
  },
  requirements: {
    type: String, 
    default: "Traer DNI y fotocopia del acta de nacimiento." 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  // New Availability Constraints
  allowedDays: {
    type: [Number], // 0=Sun, 1=Mon, ..., 6=Sat. If empty, follows global configuration.
    default: [] 
  },
  timeRange: {
    startTime: { type: String, default: null }, // e.g. "08:00". If null, follows global start.
    endTime: { type: String, default: null }    // e.g. "10:00". If null, follows global end.
  },
  dateRange: {
    start: { type: Date, default: null }, // If set, service only available from this date (inclusive)
    end: { type: Date, default: null }    // If set, service only available until this date (inclusive)
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Custom Notification Templates
  emailTemplate: {
    subject: { type: String, default: null },
    body: { type: String, default: null }
  },
  whatsappTemplate: {
    body: { type: String, default: null }
  }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
