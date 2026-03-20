const app = require('../server/src/app');
const mongoose = require('mongoose');

// Cache the database connection to reuse in serverless invocations
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    
    // Check if we have an active connection
    if (mongoose.connections[0].readyState) {
        isConnected = true;
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log('✅ MongoDB Connected (Serverless)');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error);
        throw error;
    }
};

module.exports = async (req, res) => {
    await connectDB();
    return app(req, res);
};
