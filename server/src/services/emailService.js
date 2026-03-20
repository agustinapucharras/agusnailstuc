
const nodemailer = require('nodemailer');

let transporter;

if (process.env.USE_SIMULATED_EMAIL === 'true') {
  console.log('🧪 Email Service: SIMULATION MODE (Emails will be logged to console)');
  transporter = {
    verify: (cb) => cb(null, true),
    sendMail: async (mailOptions) => {
        console.log(`\n📨 [SIMULATED EMAIL] To: ${mailOptions.to}`);
        console.log(`   Subject: ${mailOptions.subject}`);
        console.log(`   Body Preview: ${mailOptions.text.substring(0, 100)}...\n`);
        return { messageId: 'simulated-id-123' };
    }
  };
} else {
    transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER || 'ethereal_user',
        pass: process.env.EMAIL_PASS || 'ethereal_pass'
    }
    });

    // Verify connection configuration
    transporter.verify(function (error, success) {
    if (error) {
        console.log('⚠️ Email Service Error:', error.message);
        console.log('   (Emails will not be sent until SMTP is configured correctly)');
    } else {
        console.log('✅ Email Service is ready to take messages');
    }
    });
}

const Config = require('../models/Config');

exports.sendConfirmation = async (to, appointment, service, isReminder = false) => {
  let subject, text, html;

  if (isReminder) {
    // Simple reminder message matching WhatsApp format
    const dateObj = new Date(appointment.date + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });

    const clientName = appointment.client?.fullName || 'estimado/a';
    const serviceName = service?.name || 'su trámite';

    // Check for Service-Specific Template for Reminder
    if (service.emailTemplate?.body) {
        if (service.emailTemplate.subject) {
             subject = `Recordatorio: ${service.emailTemplate.subject}`;
        } else {
             subject = `Recordatorio de Turno - ${serviceName}`;
        }
        
        text = service.emailTemplate.body
            .replace(/{servicio}/g, service.name)
            .replace(/{fecha}/g, appointment.date)
            .replace(/{hora}/g, appointment.time)
            .replace(/{cliente}/g, appointment.student?.name || '')
            .replace(/{dni}/g, appointment.student?.dni || '')
            .replace(/{solicitante}/g, appointment.client?.fullName || '');

        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #052659;">Recordatorio de Turno</h2>
            <div style="white-space: pre-wrap;">${text}</div> 
            <hr>
            <p style="font-size: 12px; color: #666;">Este es un mensaje automático.</p>
          </div>
        `;
    } else {
        subject = `Recordatorio de Turno - ${serviceName}`;
        text = `Hola ${clientName}, te recordamos tu turno para ${serviceName} el día ${dateStr} a las ${appointment.time} hs en el Colegio Santísimo Rosario. Por favor confirmar asistencia.`;

        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #052659;">Recordatorio de Turno</h2>
            <p style="font-size: 16px; line-height: 1.6;">
              Hola <strong>${clientName}</strong>,
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Te recordamos tu turno para <strong>${serviceName}</strong> el día 
              <strong>${dateStr}</strong> a las <strong>${appointment.time} hs</strong>.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Por favor confirmar asistencia.
            </p>
            <hr>
            <p style="font-size: 12px; color: #666;">Este es un mensaje automático.</p>
          </div>
        `;
    }

    
    // Check for Service-Specific Whatsapp Template (for the link logic if needed externally, but here we just send email)
    // Actually, whatsapp link is generated in controller. But text content for email is what we handle here.
  } else {
    // Original confirmation message
    subject = `Confirmación de Turno - ${service.name}`;
    
    // 1. Check Service-Specific Template
    if (service.emailTemplate?.body) {
        // Use Service Template
        console.log(`Using Service-Specific Email Template for service: ${service.name}`);
        subject = service.emailTemplate.subject || subject;
        text = service.emailTemplate.body
            .replace(/{servicio}/g, service.name)
            .replace(/{fecha}/g, appointment.date)
            .replace(/{hora}/g, appointment.time)
            .replace(/{cliente}/g, appointment.student?.name || '')
            .replace(/{dni}/g, appointment.student?.dni || '')
            .replace(/{solicitante}/g, appointment.client?.fullName || '');
            
    } else {
        // 2. Use Global System Template (Fallback)
        text = `
Se ha confirmado su turno para el servicio: ${service.name}.

Detalles:
- Fecha: ${appointment.date}
- Hora: ${appointment.time}
- Alumno: ${appointment.student?.name}

Gracias por utilizar nuestro sistema.
Atte. Agus Nails Tuc
`;
        try {
            // Try to fetch custom template
            const config = await Config.findOne({ key: 'email_template' });
            if (config && config.value) {
                subject = config.value.subject
                  .replace('{servicio}', service.name);
                  
                text = config.value.body
                  .replace('{servicio}', service.name)
                  .replace('{fecha}', appointment.date)
                  .replace('{hora}', appointment.time)
                  .replace('{cliente}', appointment.student?.name)
                  .replace('{dni}', appointment.student?.dni);
            }
        } catch (err) {
            console.error('Error loading email template, using default.', err);
        }
    }

    html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #052659;">Confirmación de Turno</h2>
        <div style="white-space: pre-wrap;">${text}</div> 
        <hr>
        <p style="font-size: 12px; color: #666;">Este es un mensaje automático.</p>
      </div>
    `;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Sistema de Turnos" <noreply@school.edu>',
      to,
      subject,
      text,
      html
    });
    console.log('📧 Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    // Don't throw to avoid crashing the appointment response, just log it.
    return null;
  }
};

exports.sendCancellation = async (to, appointment, service) => {
    const dateObj = new Date(appointment.date + 'T00:00:00');
    const dateStr = dateObj.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });

    const clientName = appointment.client?.fullName || 'estimado/a';
    const serviceName = service?.name || 'su trámite';

    const subject = `Turno Cancelado - ${serviceName}`;
    const text = `Hola ${clientName}, le informamos que su turno para ${serviceName} el día ${dateStr} a las ${appointment.time} hs ha sido cancelado.`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #dc3545;">Turno Cancelado</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Hola <strong>${clientName}</strong>,
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          Le informamos que su turno para <strong>${serviceName}</strong> el día 
          <strong>${dateStr}</strong> a las <strong>${appointment.time} hs</strong> 
          ha sido <strong>cancelado</strong>.
        </p>
        <p style="font-size: 16px; line-height: 1.6;">
          Si esto es un error o desea reprogramar, por favor contáctenos o solicite un nuevo turno.
        </p>
        <hr>
        <p style="font-size: 12px; color: #666;">Este es un mensaje automático.</p>
      </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Sistema de Turnos" <noreply@school.edu>',
            to,
            subject,
            text,
            html
        });
        console.log('📧 Cancellation Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending cancellation email:', error);
        return null;
    }
};

exports.sendPasswordRecovery = async (to, tempPassword) => {
    const subject = 'Recuperación de Contraseña';
    const text = `Hola, su nueva contraseña temporal es: ${tempPassword}. Por favor adminístrela con cuidado y cámbiela al ingresar.`;

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #487874;">Recuperación de Contraseña</h2>
        <p>Hola,</p>
        <p>Se ha solicitado restablecer su contraseña de administrador.</p>
        <p>Su nueva clave temporal es:</p>
        <div style="background: #f0f0f0; padding: 15px; font-size: 20px; font-family: monospace; text-align: center; border-radius: 5px;">
            ${tempPassword}
        </div>
        <br>
        <p>Por favor ingrese al sistema y cambie esta contraseña inmediatamente.</p>
        <hr>
        <p style="font-size: 12px; color: #666;">Si usted no solicitó esto, contacte al soporte urgente.</p>
      </div>
    `;

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Sistema de Turnos" <noreply@school.edu>',
            to,
            subject,
            text,
            html
        });
        console.log('📧 Password Recovery Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Error sending recovery email:', error);
        throw error;
    }
};
