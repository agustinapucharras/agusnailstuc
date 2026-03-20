const Employee = require('../models/Employee');

// GET /api/v1/employees
exports.getEmployees = async (req, res, next) => {
  try {
    // Return all non-deleted employees
    const employees = await Employee.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/employees
exports.createEmployee = async (req, res, next) => {
  try {
    const { name, email, username, password, phone, role, workShift } = req.body;
    
    // Verificar email único
    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
        return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Verificar username único
    const usernameExists = await Employee.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }

    const employee = await Employee.create({ 
      name, 
      email, 
      username: username.toLowerCase(), 
      password, 
      phone, 
      role, 
      workShift 
    });
    
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
};


// PUT /api/v1/employees/:id
exports.updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, username, password, phone, role, workShift } = req.body;
    
    const employee = await Employee.findById(id);
    if (!employee) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Verificar email único (si cambió)
    if (email && email !== employee.email) {
      const emailExists = await Employee.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      employee.email = email;
    }

    // Verificar username único (si cambió)
    if (username && username.toLowerCase() !== employee.username) {
      const usernameExists = await Employee.findOne({ 
        username: username.toLowerCase(), 
        _id: { $ne: id } 
      });
      if (usernameExists) {
        return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
      }
      employee.username = username.toLowerCase();
    }

    // Actualizar campos básicos
    if (name) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (role) employee.role = role;
    if (workShift) employee.workShift = workShift;

    // Actualizar password solo si se proporciona
    if (password && password.trim() !== '') {
      employee.password = password; // El middleware pre-save lo hasheará
    }

    await employee.save();
    res.json(employee);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/employees/:id/toggle
exports.toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id);

    if (!employee) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Toggle active status
    employee.isActive = !employee.isActive;
    await employee.save();

    res.json({ message: `Empleado ${employee.isActive ? 'activado' : 'desactivado'}`, employee });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/employees/:id (Soft Delete)
exports.deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const employee = await Employee.findByIdAndUpdate(
        id, 
        { isDeleted: true, isActive: false }, 
        { new: true }
    );

    if (!employee) {
        return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({ message: 'Empleado eliminado correctamente', employee });
  } catch (error) {
    next(error);
  }
};
