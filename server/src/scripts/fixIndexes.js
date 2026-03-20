require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/turnos_escolares");
        console.log('Connected to DB...');

        const indexes = await Appointment.collection.indexes();
        console.log('Current Indexes:', indexes);

        // Try to find the old unique index on date_1_time_1
        const oldIndex = indexes.find(idx => idx.key.date === 1 && idx.key.time === 1 && !idx.key.service);
        
        if (oldIndex) {
            console.log(`Found old strict index: ${oldIndex.name}. Dropping it...`);
            await Appointment.collection.dropIndex(oldIndex.name);
            console.log('Old index dropped successfully.');
        } else {
            console.log('No conflicting old index found.');
        }

        console.log('Done. New index will be created automatically by schema on restart.');
        process.exit(0);

    } catch (error) {
        console.error('Error fixing indexes:', error);
        process.exit(1);
    }
};

fixIndexes();
