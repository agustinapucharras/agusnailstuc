require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const Service = require('../models/Service');

const verifyConnection = async () => {
    let uri = process.env.MONGO_URI;
    console.log('🔍 Testing Connection...');

    if (process.env.USE_SIMULATED_DB === 'true') {
        console.log('🧪 Mode: SIMULATED DATABASE');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
            console.log(`✅ MongoMemoryServer started successfully at: ${uri}`);
        } catch (err) {
            console.error('❌ Failed to start Simulated DB:', err.message);
            process.exit(1);
        }
    } else {
        console.log(`📡 Mode: REAL DATABASE (${uri})`);
        if (!uri || uri.includes('<CLUSTER_URL_AQUI>')) {
             console.error('❌ ERROR: MONGO_URI is missing or contains placeholders.');
             process.exit(1);
        }
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB successfully!');
        
        // Check Models
        const adminCount = await Admin.countDocuments();
        const serviceCount = await Service.countDocuments();
        
        console.log(`📊 Current Data Status:`);
        console.log(`   - Admins: ${adminCount}`);
        console.log(`   - Services: ${serviceCount}`);

        if (serviceCount === 0) {
            console.log('⚠️ Database is empty (Expected if just started in memory).');
        } else {
            console.log('✨ Models are accessible and data exists.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    }
};

verifyConnection();
