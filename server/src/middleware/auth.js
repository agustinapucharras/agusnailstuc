const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET not configured');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists (Try Admin then Employee)
      let user = await Admin.findById(decoded.id).select('-password');
      if (user) {
          req.user = user;
          // Normalize role for easy checking
          // Admin model has role: 'superadmin' or 'admin' 
      } else {
          user = await Employee.findById(decoded.id).select('-password');
          if (user) {
              if (!user.isActive) {
                  return res.status(401).json({ error: 'Usuario inactivo.' });
              }
              req.user = user;
              // Employee model has role: 'admin' or 'staff'
              // Note: Employee 'admin' vs Admin 'admin' - both are administrators
          }
      }

      if (!user) {
          return res.status(401).json({ error: 'Usuario no encontrado con este token.' });
      }

      next();
    } catch (error) {
      console.error('Auth Error:', error.message);
      return res.status(401).json({ error: 'No autorizado, token inválido' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'No autorizado, no hay token' });
  }
};

// Middleware to restrict access to specific roles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // req.user.role must match one of the allowed roles
        // We need to handle hierarchy or specific roles
        // Admin roles: 'superadmin', 'admin'
        // Employee roles: 'admin', 'staff'
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'No tiene permisos para realizar esta acción' });
        }
        next();
    };
};
