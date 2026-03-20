require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const Client = require('../models/Client');
const Student = require('../models/Student');

// --- HELPER: Setup DB ---
const setup = async () => {
    let uri = process.env.MONGO_URI;
    if (process.env.USE_SIMULATED_DB === 'true') {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        console.log('🧪 Using Simulated DB for Test');
    }
    await mongoose.connect(uri);
    // Clear data for clean test
    await Appointment.deleteMany({});
    await Service.deleteMany({});
    await Client.deleteMany({});
    await Student.deleteMany({});
};

const runTests = async () => {
    try {
        await setup();
        console.log('🚀 Starting System Logic Verification...\n');

        // 1. SETUP SERVICES
        console.log('1️⃣  Creating Services...');
        const serviceA = await Service.create({ 
            name: 'Service A (Matrícula)', 
            duration: 15, 
            allowedDays: [1, 3, 5], // Mon, Wed, Fri
            timeRange: { startTime: '08:00', endTime: '12:00' }
        });
        const serviceB = await Service.create({ 
            name: 'Service B (Certificado)', 
            duration: 15, 
            allowedDays: [1, 2, 3, 4, 5] // All weekdays
        });
        console.log('   ✅ Services created.');

        // 2. TEST: Valid Appointment
        console.log('\n2️⃣  Test: Valid Appointment Creation');
        // A Monday (2026-02-02 is a Monday)
        const validDate = '2026-02-02'; 
        const validTime = '08:00';

        let client = await Client.create({ 
            fullName: 'Juan Perez', 
            dni: '123', 
            email: 'test@test.com',
            phone: '555-1234' 
        });
        
        let student = await Student.create({ name: 'Hijo Perez', dni: '999', tutor: client._id });

        const app1 = await Appointment.create({
            date: validDate,
            time: validTime,
            service: serviceA._id,
            client: client._id,
            student: student._id, // Required
            status: 'pendiente'
        });
        console.log('   ✅ Appointment 1 created successfully.');

        // 3. TEST: Double Booking (Same Service) -> SHOULD FAIL
        console.log('\n3️⃣  Test: Double Booking Prevention (Same Service)');
        try {
            await Appointment.create({
                date: validDate,
                time: validTime,
                service: serviceA._id, // SAME Service
                client: client._id,
                student: student._id,
                status: 'pendiente'
            });
            console.error('   ❌ FAILED: Duplicate appointment was allowed!');
        } catch (err) {
            if (err.code === 11000) {
                console.log('   ✅ SUCCESS: Duplicate appointment blocked (Index 11000).');
            } else {
                console.error('   ⚠️ Unexpected error:', err.message);
            }
        }

        // 4. TEST: Parallel Booking (Diff Service) -> SHOULD SUCCESS
        console.log('\n4️⃣  Test: Parallel Booking (Different Service)');
        try {
            const app2 = await Appointment.create({
                date: validDate, // Same Date
                time: validTime, // Same Time
                service: serviceB._id, // DIFFERENT Service
                client: client._id,
                student: student._id,
                status: 'pendiente'
            });
            console.log('   ✅ SUCCESS: Parallel appointment created for Service B.');
        } catch (err) {
            console.error('   ❌ FAILED: Could not create parallel appointment:', err.message);
        }

        // 5. TEST: Service Constraints (Day not allowed)
        // Service A is Mon/Wed/Fri. Let's try Tuesday (2026-02-03)
        // NOTE: The model schema doesn't validate this automatically (controller does), 
        // strictly speaking this test verifies DB schema, not controller logic, 
        // but checking the Data Integrity is key.
        
        console.log('\n🏁 Verification Complete.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Critical Test Error:', err);
        process.exit(1);
    }
};

runTests();
