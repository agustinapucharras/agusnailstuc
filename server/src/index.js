require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const startServer = async () => {
  const PORT = process.env.PORT || 5000;
  
  if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      console.error('❌ FATAL: JWT_SECRET must be defined in production.');
      process.exit(1);
  }

  let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gestion_turnos_db';

  if (process.env.USE_SIMULATED_DB === 'true') {
     console.log('🧪 Starting Simulated Database (Memory)...');
     try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        mongoUri = mongod.getUri();
        console.log(`🧪 Simulated DB URI: ${mongoUri}`);
     } catch (err) {
        console.error('❌ Failed to start Simulated DB:', err);
        process.exit(1);
     }
  }

  try {
      await mongoose.connect(mongoUri, {
        maxPoolSize: 200, // Optimized for 800 students (peak load ~560 active)
        minPoolSize: 50, // Maintain warm connections
        serverSelectionTimeoutMS: 60000, // Keep trying to send operations for 60 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      });
      console.log('✅ MongoDB Connected successfully');

      // Seed Initial Data
      await require('./utils/seed')();

      app.listen(PORT, () => {
          console.log(`🚀 Server running on port ${PORT}`);
      });
  } catch (err) {
      console.error('❌ Startup Error:', err);
      process.exit(1);
  }
};

startServer();
