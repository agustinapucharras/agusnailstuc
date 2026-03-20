const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  key: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g., "weekly_schedule"
  value: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  } 
});

module.exports = mongoose.model('Config', configSchema);
