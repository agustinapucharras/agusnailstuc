const Client = require('../models/Client');
const Appointment = require('../models/Appointment');

// GET /api/v1/clients
exports.getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search) {
        query = {
            $or: [
                { fullName: { $regex: search, $options: 'i' } },
                { dni: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Client.countDocuments(query);
    const clients = await Client.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        data: clients,
        meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/clients/:id
exports.getClientDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);
    
    if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Get History
    const appointments = await Appointment.find({ client: id })
        .populate('student', 'name dni')
        .populate('service', 'name')
        .sort({ date: -1, time: -1 });

    const stats = {
        total: appointments.length,
        attended: appointments.filter(a => a.status === 'asistio').length,
        cancelled: appointments.filter(a => a.status === 'cancelado').length,
        pending: appointments.filter(a => ['pendiente', 'confirmado'].includes(a.status)).length
    };

    res.json({
        client,
        history: appointments,
        stats
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/clients/:id
exports.updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, dni, email, phone } = req.body;

    // Validate required fields
    if (!fullName || !dni || !email || !phone) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Check if client exists
    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Check if DNI or email already exist in another client
    if (dni !== client.dni) {
      const existingDni = await Client.findOne({ dni, _id: { $ne: id } });
      if (existingDni) {
        return res.status(400).json({ error: 'El DNI ya está registrado' });
      }
    }

    if (email !== client.email) {
      const existingEmail = await Client.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }

    // Update client
    client.fullName = fullName;
    client.dni = dni;
    client.email = email;
    client.phone = phone;
    await client.save();

    res.json({ 
      message: 'Cliente actualizado exitosamente',
      client 
    });
  } catch (error) {
    next(error);
  }
};
