require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Service = require('../models/Service');
const Config = require('../models/Config');

// DB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gestion_turnos_db';

const connectDB = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB Connected (Seed)');
    }
};

const seedData = async () => {
  try {
    // 1. Seed Admin
    const adminExists = await Admin.findOne({ username: 'admin' });
    if (!adminExists) {
        // En producción, requerir una contraseña fuerte o generarla
        const initialPassword = process.env.ADMIN_INIT_PASSWORD || 'password123';
        
        if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_INIT_PASSWORD) {
             console.warn('⚠️ WARNING: Using default admin password in production. Please set ADMIN_INIT_PASSWORD env var.');
        }

        await Admin.create({
            username: 'admin',
            email: process.env.ADMIN_EMAIL || 'admin@estetica.com',
            password: initialPassword, // Will be hashed by pre-save
            role: 'superadmin'
        });
        console.log(`✅ Admin user created (user: admin).`);
    } else {
        console.log('ℹ️ Admin user already exists');
        
        // Check if existing admin email matches env var, if not, update it
        const expectedEmail = process.env.ADMIN_EMAIL || 'admin@estetica.com';
        if (adminExists.email !== expectedEmail) {
            adminExists.email = expectedEmail;
            await adminExists.save();
            console.log(`✅ Updated existing admin email to: ${expectedEmail}`);
        }
    }


    // 2. Seed Services (if none)
    const servicesCount = await Service.countDocuments();
    if (servicesCount === 0) {
        await Service.create([
            { name: 'Uñas semipermanente', description: 'Servicio de esmaltado semipermanente', duration: 60, isActive: true },
            { name: 'Lifting de pestañas', description: 'Levantamiento y curvado de pestañas', duration: 45, isActive: true }
        ]);
        console.log('✅ Default services created');
    }


    // 3. Seed Config
    const configExists = await Config.findOne({ key: 'weekly_schedule' });
    if (!configExists) {
        await Config.create({
            key: 'weekly_schedule',
            value: { startTime: '08:00', endTime: '12:30', interval: 15, daysOff: [0, 6] }
        });
        console.log('✅ Default schedule config created');
    }

    console.log('🌱 Seeding completed');
    // Only exit if run independently
    if (require.main === module) process.exit();
  } catch (error) {
    console.error('❌ Error Seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
    connectDB().then(seedData);
}

module.exports = seedData;
