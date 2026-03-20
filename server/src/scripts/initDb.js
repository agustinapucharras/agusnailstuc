require('dotenv').config();
const mongoose = require('mongoose');
const seedData = require('../utils/seed');

const initDb = async () => {
    console.log('📦 Initializing Database Collections...');
    let uri = process.env.MONGO_URI;

    // Handle Simulated DB Logic
    if (process.env.USE_SIMULATED_DB === 'true') {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('🧪 Using Simulated DB (Memory)');
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        // Run Seed
        await seedData();
        
        console.log('✨ Collections initialized successfully:');
        const collections = await mongoose.connection.db.listCollections().toArray();
        collections.forEach(col => console.log(`   - 📂 ${col.name}`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing DB:', error);
        process.exit(1);
    }
};

initDb();
