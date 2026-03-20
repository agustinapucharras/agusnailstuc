const Service = require('../models/Service');

exports.getServices = async (req, res, next) => {
  try {
    // Use $ne: true to include documents where isDeleted is false OR undefined
    // Return all non-deleted services to allow frontend to handle active/inactive display.
    const query = { isDeleted: { $ne: true } };

    const services = await Service.find(query).sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    next(error);
  }
};

exports.createService = async (req, res, next) => {
    try {
        const { name, duration, requirements, allowedDays, timeRange, dateRange, isActive, emailTemplate, whatsappTemplate } = req.body;
        const service = await Service.create({ 
            name, 
            duration, 
            requirements,
            allowedDays,
            timeRange,
            dateRange,
            isActive,
            emailTemplate,
            whatsappTemplate
        });
        res.status(201).json(service);
    } catch (error) {
        next(error);
    }
};

exports.updateService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await Service.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        res.json(service);
    } catch (error) {
        next(error);
    }
};

// PATCH /api/v1/services/:id/toggle
exports.toggleServiceStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentService = await Service.findById(id);
        if (!currentService) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        const service = await Service.findByIdAndUpdate(
            id, 
            { isActive: !currentService.isActive }, 
            { new: true }
        );
        
        const action = service.isActive ? 'activado' : 'desactivado';
        res.json({ message: `Servicio ${action}`, service });
    } catch (error) {
        next(error);
    }
};

// DELETE /api/v1/services/:id (Soft Delete)
exports.deleteService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const service = await Service.findByIdAndUpdate(
            id, 
            { isDeleted: true, isActive: false }, // Mark deleted and inactive
            { new: true }
        );
        
        if (!service) {
            return res.status(404).json({ error: 'Servicio no encontrado' });
        }
        
        res.json({ message: 'Servicio eliminado correctamente', service });
    } catch (error) {
        next(error);
    }
};
