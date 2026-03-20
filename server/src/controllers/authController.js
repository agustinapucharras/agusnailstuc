const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Employee = require('../models/Employee');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });
};

// POST /api/v1/auth/login
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    console.log('🔐 [LOGIN] Attempt started');
    console.log('📧 [LOGIN] Username/Email:', username);
    console.log('🔑 [LOGIN] Password received:', password ? 'YES (length: ' + password.length + ')' : 'NO');

    // 1. Validation
    if (!username || !password) {
      console.log('❌ [LOGIN] Missing credentials');
      return res.status(400).json({ error: 'Por favor ingrese usuario y contraseña' });
    }

    // 2. Try Admin first (search by username OR email)
    console.log('🔍 [LOGIN] Searching in Admin collection...');
    const admin = await Admin.findOne({
      $or: [
        { username: username },
        { email: username.toLowerCase() }
      ]
    });
    
    if (admin) {
      console.log('✅ [LOGIN] Admin found!');
      console.log('   - ID:', admin._id);
      console.log('   - Email:', admin.email);
      console.log('   - Username:', admin.username);
      console.log('   - Role:', admin.role);
      
      // 3. Check Password
      console.log('🔐 [LOGIN] Checking password...');
      const isMatch = await admin.matchPassword(password);
      console.log('🔑 [LOGIN] Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('❌ [LOGIN] Password MISMATCH - returning 401');
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // 4. Generate Token
      console.log('🎟️ [LOGIN] Generating token...');
      const token = generateToken(admin._id);
      console.log('✅ [LOGIN] Login successful for admin:', admin.email);

      return res.json({
        success: true,
        token,
        userType: 'admin',
        admin: {
          id: admin._id,
          username: admin.username,
          role: admin.role
        }
      });
    }

    // 5. If not admin, try Employee (search by username OR email)
    console.log('👤 [LOGIN] Admin not found, searching in Employee collection...');
    const employee = await Employee.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });
    
    if (employee) {
      console.log('✅ [LOGIN] Employee found!');
      console.log('   - ID:', employee._id);
      console.log('   - Email:', employee.email);
      console.log('   - Username:', employee.username);
      console.log('   - Role:', employee.role);
      console.log('   - isActive:', employee.isActive);
      
      // Check if active
      if (!employee.isActive) {
        console.log('❌ [LOGIN] Employee INACTIVE - returning 401');
        return res.status(401).json({ error: 'Usuario inactivo. Contacte al administrador.' });
      }

      // Check Password
      console.log('🔐 [LOGIN] Checking employee password...');
      const isMatch = await employee.comparePassword(password);
      console.log('🔑 [LOGIN] Password match result:', isMatch);
      
      if (!isMatch) {
        console.log('❌ [LOGIN] Employee password MISMATCH - returning 401');
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Generate Token
      console.log('🎟️ [LOGIN] Generating token...');
      const token = generateToken(employee._id);
      console.log('✅ [LOGIN] Login successful for employee:', employee.email);

      return res.json({
        success: true,
        token,
        userType: 'employee',
        employee: {
          id: employee._id,
          username: employee.username,
          name: employee.name,
          email: employee.email,
          role: employee.role,
          workShift: employee.workShift
        }
      });
    }

    // 6. If neither admin nor employee found
    console.log('❌ [LOGIN] USER NOT FOUND - neither Admin nor Employee - returning 401');
    return res.status(401).json({ error: 'Credenciales inválidas' });

  } catch (error) {
    console.error('💥 [LOGIN] Exception caught:', error.message);
    console.error('   Stack:', error.stack);
    next(error);
  }
};

// POST /api/v1/auth/employee/login
exports.employeeLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // 1. Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Por favor ingrese usuario y contraseña' });
    }

    // 2. Check Employee (search by username OR email)
    const employee = await Employee.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });
    
    if (!employee) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Check if active
    if (!employee.isActive) {
      return res.status(401).json({ error: 'Empleado inactivo. Contacte al administrador.' });
    }

    // 4. Check Password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 5. Generate Token
    const token = generateToken(employee._id);

    res.json({
      success: true,
      token,
      employee: {
        id: employee._id,
        username: employee.username,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        workShift: employee.workShift
      }
    });

  } catch (error) {
    next(error);
  }
};

// TEMP: Seed Route for Dev
exports.seedAdmin = async (req, res) => {
    // Disable in production
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }

    const username = 'admin';
    const password = 'password123';
    
    let admin = await Admin.findOne({ username });
    if (!admin) {
        admin = await Admin.create({ username, password });
        return res.json({ msg: 'Admin created', user: username });
    }
    return res.json({ msg: 'Admin already exists' });
};

// POST /api/v1/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: 'Ingrese un email válido' });
        }

        // Try to find user in Admin model first
        let user = await Admin.findOne({ email });
        let userType = 'admin';
        
        // If not found in Admin, try Employee model
        if (!user) {
            user = await Employee.findOne({ email });
            userType = 'employee';
        }
        
        if (!user) {
            // For security, we could return success anyway, but let's be explicit for now
            return res.status(404).json({ error: 'No existe usuario con ese email' });
        }

        // Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
        
        // Update password
        user.password = tempPassword;
        await user.save();

        // Send email
        const emailService = require('../services/emailService');
        await emailService.sendPasswordRecovery(email, tempPassword);

        res.json({ message: 'Se ha enviado una nueva contraseña a su correo.' });

    } catch (error) {
        next(error);
    }
};
