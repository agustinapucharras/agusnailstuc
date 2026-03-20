const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Load environment variables (ensure dotenv is configured in index.js or before app usage)
// require('dotenv').config(); 

const app = express();

// --- Middlewares ---
app.use(helmet()); // Security Headers
app.use(cors({
  origin: process.env.CLIENT_URL || '*', // Allow specific origin in production
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev')); // Logger
app.use(express.json()); // Body parser

// --- Rate Limiting ---
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute (changed from 15 to prevent blocking legitimate users)
  limit: 150, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// --- Routes ---
app.get('/', (req, res) => {
  res.json({ message: 'Gestion Turnos API v1.0 - Server Running' });
});

// Import Routes Here
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/appointments', require('./routes/appointmentRoutes'));
app.use('/api/v1/services', require('./routes/serviceRoutes'));
app.use('/api/v1/config', require('./routes/configRoutes')); // New Route
app.use('/api/v1/clients', require('./routes/clientRoutes'));
app.use('/api/v1/employees', require('./routes/employeeRoutes'));

// --- Error Handling ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;
