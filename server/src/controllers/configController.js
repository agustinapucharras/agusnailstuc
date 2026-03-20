const Config = require('../models/Config');

// GET /api/v1/config
exports.getConfig = async (req, res, next) => {
  try {
    let config = await Config.findOne({ key: 'weekly_schedule' });
    if (!config) {
        // Return defaults if not set in DB
        return res.json({ 
            startTime: '08:00', 
            endTime: '12:30', 
            interval: 5, 
            daysOff: [0, 6],
            holidays: [] 
        });
    }
    res.json(config.value);
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/config
exports.updateConfig = async (req, res, next) => {
  try {
    const { startTime, endTime, interval, daysOff, holidays } = req.body;

    // Basic validation
    if (!startTime || !endTime || !interval) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    let config = await Config.findOne({ key: 'weekly_schedule' });
    if (!config) {
        config = new Config({ key: 'weekly_schedule', value: {} });
    }

    config.value = {
        startTime,
        endTime,
        interval: parseInt(interval),
        daysOff: daysOff || [],
        holidays: holidays || []
    };

    await config.save();
    res.json({ success: true, config: config.value });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/config/email-template
exports.getEmailTemplate = async (req, res, next) => {
    try {
        let config = await Config.findOne({ key: 'email_template' });
        if (!config) {
            return res.json({ 
                subject: 'Confirmación de Turno - {servicio}',
                body: `Hola,

Se ha confirmado su turno para el servicio: {servicio}.

Detalles:
- Fecha: {fecha}
- Hora: {hora}
- Alumno: {alumno}
- DNI: {dni}

Gracias por utilizar nuestro sistema.
Atte. Institución`
            });
        }
        res.json(config.value);
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/config/email-template
exports.updateEmailTemplate = async (req, res, next) => {
    try {
        const { subject, body } = req.body;

        if (!subject || !body) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        let config = await Config.findOne({ key: 'email_template' });
        if (!config) {
            config = new Config({ key: 'email_template', value: {} });
        }

        config.value = { subject, body };
        await config.save();
        res.json({ success: true, config: config.value });
    } catch (error) {
        next(error);
    }
};
// GET /api/v1/config/sms-template
exports.getSmsTemplate = async (req, res, next) => {
    try {
        let config = await Config.findOne({ key: 'sms_template' });
        if (!config) {
            return res.json({ 
                body: `Hola {cliente}, tu turno para {servicio} el {fecha} a las {hora} ha sido confirmado en la Estética.`
            });
        }
        res.json(config.value);
    } catch (error) {
        next(error);
    }
};

// PUT /api/v1/config/sms-template
exports.updateSmsTemplate = async (req, res, next) => {
    try {
        const { body } = req.body;

        if (!body) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        let config = await Config.findOne({ key: 'sms_template' });
        if (!config) {
            config = new Config({ key: 'sms_template', value: {} });
        }

        config.value = { body };
        await config.save();
        res.json({ success: true, config: config.value });
    } catch (error) {
        next(error);
    }
};
