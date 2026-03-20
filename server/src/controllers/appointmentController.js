const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Config = require('../models/Config');
const Service = require('../models/Service');
const Client = require('../models/Client');
const Student = require('../models/Student');
const emailService = require('../services/emailService');

// Helper to generate time slots
const generateSlots = (startStr, endStr, interval) => {
  const slots = [];
  const [startHour, startMin] = startStr.split(':').map(Number);
  const [endHour, endMin] = endStr.split(':').map(Number);
  
  let current = new Date();
  current.setHours(startHour, startMin, 0, 0);
  
  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);
  
  while (current < end) {
    const timeString = current.toTimeString().slice(0, 5);
    slots.push(timeString);
    current.setMinutes(current.getMinutes() + interval);
  }
  
  return slots;
};

// GET /api/v1/appointments/slots?date=YYYY-MM-DD
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    // 1. Get Operational Config (Default if missing)
    let config = await Config.findOne({ key: 'weekly_schedule' });
    if (!config) {
        // Fallback or Initial Config
        config = { value: { startTime: '08:00', endTime: '12:30', interval: 15, daysOff: [0, 6] } };
    }
    let { startTime, endTime, interval, daysOff, holidays } = config.value;

    // Check optional holidays
    if (holidays && Array.isArray(holidays) && holidays.includes(date)) {
        return res.json([]); // Holiday
    }

    // 2. Check if day is off (0=Sun, 6=Sat)
    // Note: 'date' string parsing might depend on timezone, but simpler to just use vanilla JS for Day index
    // Be careful with UTC vs Local. For now, assuming date string YYYY-MM-DD matches locale.
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    if (daysOff.includes(dayOfWeek)) {
        return res.json([]); // Closed today
    }

    // 3. Service-Specific Overrides
    const { serviceId } = req.query;
    if (serviceId) {
        const service = await Service.findById(serviceId);
        if (service) {
            // Check if Service is Deleted
            if (service.isDeleted) {
                return res.json([]); // No slots for deleted service
            }

            // Check if Service is Active
            if (!service.isActive) {
                return res.json([]); // No slots for inactive service
            }

            // Check Allowed Days
            if (service.allowedDays && service.allowedDays.length > 0) {
                if (!service.allowedDays.includes(dayOfWeek)) {
                    return res.json([]); // Service not available on this day
                }
            }
            // Override Times
            if (service.timeRange?.startTime) startTime = service.timeRange.startTime;
            if (service.timeRange?.endTime) endTime = service.timeRange.endTime;

            // 🔥 USE SERVICE DURATION AS INTERVAL (Key Fix)
            if (service.duration) {
                interval = service.duration;
            }

            // Check Date Range (Vigencia)
            const requestedDate = new Date(date + 'T00:00:00'); // Local midnight
            if (service.dateRange?.start) {
                const sDate = new Date(service.dateRange.start);
                // Create local start date from UTC components
                const startDate = new Date(sDate.getUTCFullYear(), sDate.getUTCMonth(), sDate.getUTCDate());
                startDate.setHours(0,0,0,0);
                
                if (requestedDate < startDate) return res.json([]);
            }
            if (service.dateRange?.end) {
                const eDate = new Date(service.dateRange.end);
                // Create local end date from UTC components
                const endDate = new Date(eDate.getUTCFullYear(), eDate.getUTCMonth(), eDate.getUTCDate());
                endDate.setHours(23,59,59,999);
                
                if (requestedDate > endDate) return res.json([]);
            }
        }
    }

    // 4. Generate all possible slots
    const allSlots = generateSlots(startTime, endTime, interval);

    // 4. Fetch busy slots from DB (Scoped by Service if provided)
    let query = { 
        date: date, 
        status: { $in: ['pendiente', 'confirmado'] } 
    };
    
    // IMPORTANT: If we want per-service queues, we only check busy slots for THIS service.
    // If serviceId is not provided (legacy/global view), we might see all busy slots? 
    // To be safe and consistent with the new requirement:
    if (serviceId) {
        query.service = serviceId;
    }

    const busyAppointments = await Appointment.find(query).select('time -_id');

    const busyTimes = busyAppointments.map(app => app.time);

    // 5. Map all slots with availability status
    const slotsWithStatus = allSlots.map(slot => ({
        time: slot,
        available: !busyTimes.includes(slot)
    }));

    res.json(slotsWithStatus);

  } catch (error) {
    next(error);
  }
};

// GET /api/v1/appointments (Admin)
exports.getAppointments = async (req, res, next) => {
  try {
    const { date, month, year } = req.query;
    
    // Find non-deleted services to filter appointments
    const deletedServices = await Service.find({ isDeleted: true }).select('_id');
    const deletedServiceIds = deletedServices.map(s => s._id);

    let query = {
        service: { $nin: deletedServiceIds } // Exclude appointments from deleted services
    };
    
    // Filter by Service (New)
    const { serviceId } = req.query;
    if (serviceId) {
        query.service = serviceId;
    }
    
    // Filter by date if provided
    if (date) {
        query.date = date; 
    } else if (month && year) {
        const paddedMonth = String(month).padStart(2, '0');
        query.date = { $regex: `^${year}-${paddedMonth}` };
    }

    const appointments = await Appointment.find(query)
        .populate('client', 'fullName dni email phone')
        .populate('student', 'name dni')
        .populate({
            path: 'service',
            select: 'name duration isDeleted',
            match: { isDeleted: { $ne: true } } // Ensure populated service is not deleted (though query handles it, triple check)
        })
        .sort({ date: 1, time: 1 });
        
    // Filter out any appointments where service is null (was deleted) or populated service is deleted
    const filteredAppointments = appointments.filter(app => app.service && !app.service.isDeleted);

    res.json(filteredAppointments);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/appointments
exports.createAppointment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { date, time, clientData, studentData, serviceId } = req.body;
    
    // Audit Data
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    const userAgent = req.headers['user-agent'];

    // 1. Validation (Simulated, should be Joi)
    if (!date || !time || !clientData || !studentData || !serviceId) {
        throw new Error('Missing required fields');
    }

    // 2. Check Availability (Scoped by Service)
    const existing = await Appointment.findOne({ 
        date, 
        time, 
        service: serviceId, // Only check collision for SAME service
        status: { $ne: 'cancelado' } 
    }).session(session);

    if (existing) {
        const error = new Error('Slot already taken for this service');
        error.code = 409;
        throw error;
    }

    // 2.1 Check if there's a CANCELLED appointment that can be REUSED
    const cancelledAppointment = await Appointment.findOne({
        date,
        time,
        service: serviceId,
        status: 'cancelado'
    }).session(session);

    // 2.2 Validate Service
    const service = await Service.findById(serviceId).session(session);
    if (!service) {
        throw new Error('Service not found');
    }

    if (!service.isActive) {
        throw new Error('El servicio seleccionado no se encuentra activo actualmente.');
    }

    // NEW: Check if student already has an active appointment for THIS SERVICE
    // First find if student exists by DNI
    const existingStudentToCheck = await Student.findOne({ dni: studentData.dni }).session(session);
    if (existingStudentToCheck) {
        const activeAppointment = await Appointment.findOne({
            student: existingStudentToCheck._id,
            service: serviceId, // 🔥 KEY: Only check for same service
            status: { $in: ['pendiente', 'confirmado'] }
        }).session(session);

        if (activeAppointment) {
            const error = new Error('Ya tiene un turno activo para este trámite. Por favor espere a que sea atendido o cancele el turno anterior.');
            error.code = 409; 
            throw error;
        }
    }

    // 3. Find or Create Client (Tutor)
    let client = await Client.findOne({ dni: clientData.dni }).session(session);
    if (!client) {
        client = await Client.create([{ 
            ...clientData,
            audit: { ip, userAgent }
        }], { session });
        client = client[0];
    } else {
        // Update info
        client.email = clientData.email;
        client.phone = clientData.phone;
        client.fullName = clientData.fullName;
        await client.save({ session });
    }

// ... (inside createAppointment function, after finding/creating client)

    // 4. Find or Create Student
    let student = await Student.findOne({ dni: studentData.dni }).session(session);
    if (!student) {
        student = await Student.create([{
            ...studentData,
            tutor: client._id,
            audit: { ip, userAgent }
        }], { session });
        student = student[0];
    } else {
        // Optional: Update student name if changed or update tutor link
        if (student.name !== studentData.name) {
            student.name = studentData.name;
            await student.save({ session });
        }
    }

    // 5. CREATE or UPDATE Appointment
    let appointment;
    
    if (cancelledAppointment) {
        // REUSE the cancelled appointment by updating it
        cancelledAppointment.client = client._id;
        cancelledAppointment.student = student._id;
        cancelledAppointment.status = 'confirmado';
        cancelledAppointment.audit = {
            sourceIp: ip, 
            userAgent, 
            platform: 'Web'
        };
        
        await cancelledAppointment.save({ session });
        appointment = cancelledAppointment;
        
    } else {
        // Create new appointment if no cancelled one exists
        const newAppointment = await Appointment.create([{
            date,
            time,
            client: client._id,
            student: student._id, 
            service: serviceId,
            status: 'confirmado',
            audit: { 
                sourceIp: ip, 
                userAgent, 
                platform: 'Web' 
            }
        }], { session });
        appointment = newAppointment[0];
    }

    // Populate student data for email (since student is just an ObjectId reference)
    const appointmentWithStudent = await Appointment.findById(appointment._id)
        .populate('student')
        .populate('client')
        .session(session);

    // 5. Trigger Notification (Async)
    // We don't await this to avoid blocking the response, or we do if we want strict confirmation.
    // Ideally we'd use a queue. For now, we'll fire and forget (logging error inside service).
    emailService.sendConfirmation(client.email, appointmentWithStudent, service);
    
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
        success: true,
        appointment: appointment,
        message: 'Turno confirmado correctamente'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.code === 11000 || error.code === 409) {
        // Return the specific error message from validation
        return res.status(409).json({ error: error.message || 'El turno ya no está disponible.' });
    }
    next(error);
  }
};

// PATCH /api/v1/appointments/:id/status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pendiente', 'confirmado', 'cancelado', 'asistio'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    if (status === 'cancelado') {
        const service = await Service.findById(appointment.service);
        // Send cancellation email asynchronously
        emailService.sendCancellation(appointment.client.email, appointment, service).catch(err => {
            console.error('Error sending cancellation email:', err);
        });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/appointments/:id
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
        .populate('client', 'fullName dni email phone')
        .populate('student', 'name dni')
        .populate('service', 'name duration');
    
    if (!appointment) {
        return res.status(404).json({ error: 'Turno no encontrado' });
    }
    
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/appointments/stats (Used by Dashboard)
exports.getStats = async (req, res, next) => {
    try {
        // Use provided date or default to today
        const { date } = req.query;
        const todayStr = date || new Date().toISOString().split('T')[0];
        
        // Helper to get non-deleted service IDs
        const activeServices = await Service.find({ isDeleted: { $ne: true } }).select('_id');
        const activeServiceIds = activeServices.map(s => s._id);

        // Today's stats (relative to selected date)
        const todayAppointments = await Appointment.find({ 
            date: todayStr,
            service: { $in: activeServiceIds } // Only count non-deleted services
        });

        const todayTotal = todayAppointments.length;
        const todayAttended = todayAppointments.filter(a => a.status === 'asistio').length;
        const todayPending = todayAppointments.filter(a => ['pendiente', 'confirmado'].includes(a.status)).length;
        
        // ... Logic for Next Week (Real Time) ...
        const today = new Date();
        const currentDay = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        
        // Calculate next Monday
        const daysUntilNextMonday = currentDay === 0 ? 1 : (8 - currentDay);
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + daysUntilNextMonday);
        nextMonday.setHours(0, 0, 0, 0);
        // End of Next Week (Saturday)
        const nextSaturday = new Date(nextMonday);
        nextSaturday.setDate(nextMonday.getDate() + 5); 
        nextSaturday.setHours(23, 59, 59, 999);
        const nextSaturdayStr = nextSaturday.toISOString().split('T')[0];

        // Start Date for "Upcoming": Tomorrow (to include rest of current week)
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Count from tomorrow until end of next week
        const upcomingTotal = await Appointment.countDocuments({
            date: { $gte: tomorrowStr, $lte: nextSaturdayStr },
            status: { $in: ['pendiente', 'confirmado'] },
            service: { $in: activeServiceIds } // Only count non-deleted services
        });

        res.json({
            today: {
                total: todayTotal,
                attended: todayAttended,
                pending: todayPending
            },
            nextWeek: upcomingTotal
        });

    } catch (error) {
        console.error('Stats Error:', error);
        // Return clear structure even on error to avoid frontend crash
        res.json({
            today: { total: 0, attended: 0, pending: 0 },
            nextWeek: 0
        });
    }
};

// PATCH /api/v1/appointments/:id/status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pendiente', 'confirmado', 'cancelado', 'asistio'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Turno no encontrado' });
    }

    if (status === 'cancelado') {
        const service = await Service.findById(appointment.service);
        // Send cancellation email asynchronously
        emailService.sendCancellation(appointment.client.email, appointment, service).catch(err => {
            console.error('Error sending cancellation email:', err);
        });
    }

    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/appointments/:id/reminder
exports.sendReminder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'email' | 'whatsapp'
        
        // Get appointment with populated data
        const appointment = await Appointment.findById(id)
            .populate('client', 'fullName email phone')
            .populate('student', 'name')
            .populate('service', 'name whatsappTemplate.body emailTemplate.subject emailTemplate.body');
        
        if (!appointment) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }
        
        const response = { success: true };

        // 1. Send Email Logic
        if (!type || type === 'email') {
            if (!appointment.client || !appointment.client.email) {
                if (type === 'email') { // Only error if explicitly requested
                    return res.status(400).json({ error: 'El turno no tiene un cliente con email asociado' });
                }
            } else {
                try {
                    await emailService.sendConfirmation(
                        appointment.client.email,
                        appointment,
                        appointment.service,
                        true // isReminder flag
                    );
                    response.message = 'Recordatorio enviado por email';
                } catch (emailError) {
                    console.error('Error sending reminder email:', emailError);
                    if (type === 'email') {
                         throw emailError;
                    }
                }
            }
        }

        // 2. WhatsApp Logic
        if (!type || type === 'whatsapp') {
             // Fetch WhatsApp/SMS Template
            // 1. Check Service Specific Template
            let template = appointment.service?.whatsappTemplate?.body;
    
            // 2. If no service template, check Global Config
            if (!template) {
                let templateConfig = await Config.findOne({ key: 'sms_template' });
                template = templateConfig ? templateConfig.value.body : null;
            }
            
            response.whatsappLink = generateWhatsAppReminderLink(appointment, template);
            if (type === 'whatsapp') {
                response.message = 'Enlace de WhatsApp generado';
            }
        }
        
        res.json(response);
        
    } catch (error) {
        console.error('Reminder Error:', error);
        next(error);
    }
};

// Helper function to generate WhatsApp reminder link
const generateWhatsAppReminderLink = (appointment, template) => {
    if (!appointment.client || !appointment.client.phone) return null;
    
    let phone = appointment.client.phone.replace(/\D/g, '');
    phone = phone.replace(/^0+/, '');
    
    if (phone.length === 10) {
        phone = '549' + phone;
    } else if (phone.length === 12 && phone.startsWith('54')) {
        phone = '549' + phone.substring(2);
    } else if (!phone.startsWith('549')) {
        phone = '549' + phone;
    }
    
    const dateObj = new Date(appointment.date + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });
    
    const serviceName = appointment.service?.name || 'su trámite';
    
    let message;

    if (template) {
        message = template
            .replace(/{cliente}/g, appointment.student?.name || '')
            .replace(/{solicitante}/g, appointment.client?.fullName || '')
            .replace(/{servicio}/g, serviceName)
            .replace(/{fecha}/g, dateStr)
            .replace(/{hora}/g, appointment.time)
            .replace(/{dni}/g, appointment.student?.dni || '');
    } else {
        // Fallback default message
        message = `Hola ${appointment.client.fullName}, te recordamos tu turno para ${serviceName} el día ${dateStr} a las ${appointment.time} hs en el Colegio Santísimo Rosario. Por favor confirmar asistencia.`;
    }
    
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};

// PUT /api/v1/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { date, time } = req.body;

        const appointment = await Appointment.findById(id).session(session);
        if (!appointment) {
            throw new Error('Turno no encontrado');
        }

        // Check availability
        const existing = await Appointment.findOne({ 
            date, 
            time, 
            service: appointment.service, 
            status: { $in: ['pendiente', 'confirmado'] },
            _id: { $ne: id } // Exclude self
        }).session(session);

        if (existing) {
            const error = new Error('El horario seleccionado ya está ocupado para este trámite.');
            error.code = 409;
            throw error;
        }

        // Update
        const oldDate = appointment.date;
        const oldTime = appointment.time;
        
        appointment.date = date;
        appointment.time = time;
        appointment.status = 'confirmado'; // Reset status to confirmed
        
        // Update audit?
        // appointment.audit.push({ ... }) if audit was an array, but it's an object. 
        // Let's simple update.

        await appointment.save({ session });

        // Fetch populated data for email
        const populatedAppointment = await Appointment.findById(id)
            .populate('client')
            .populate('student')
            .populate('service')
            .session(session);

        // Send email
        // We'll treat it as a confirmation of the new time
        emailService.sendConfirmation(populatedAppointment.client.email, populatedAppointment, populatedAppointment.service)
            .catch(err => console.error('Error sending reschedule email:', err));

        await session.commitTransaction();
        session.endSession();

        res.json({ success: true, appointment: populatedAppointment });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};

exports.getOccupiedDays = async (req, res, next) => {
    try {
        const { year, month } = req.query;
        
        if (!year || !month) {
            return res.status(400).json({ error: 'Year and month are required' });
        }
        
        // Calculate start and end of month
        const startDate = new Date(year, month - 1, 1); // month is 0-indexed
        const endDate = new Date(year, month, 0); // Last day of month
        
        // Format as YYYY-MM-DD
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];
        
        // Get IDs of non-deleted services
        const validServices = await Service.find({ isDeleted: { $ne: true } }).select('_id');
        const validServiceIds = validServices.map(s => s._id);

        // Get all unique dates with at least 1 appointment from VALID services only
        const appointments = await Appointment.aggregate([
            {
                $match: {
                    date: { $gte: startStr, $lte: endStr },
                    status: { $ne: 'cancelado' }, // Exclude cancelled
                    service: { $in: validServiceIds } // Filter by VALID Services (not deleted)
                }
            },
            {
                $group: {
                    _id: '$date',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        
        // Return array of objects with date and count
        const occupiedDays = appointments.map(item => ({
            date: item._id,
            count: item.count
        }));
        
        res.json(occupiedDays);
    } catch (error) {
        next(error);
    }
};
