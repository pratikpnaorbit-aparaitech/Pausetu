const mongoose = require('mongoose');
const axios = require('axios');
const Complaint = require('./models/Complaint');
const Animal = require('./models/Animal');
const User = require('./models/User');
const dotenv = require('dotenv');
const { generateToken } = require('./utils/jwt');

dotenv.config();

const API_URL = 'http://127.0.0.1:5000/api';

async function runInvestigation() {
  console.log('--- STARTING INVESTIGATION ---');
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pashusetu');
    console.log('✅ Connected to MongoDB');

    const animal = await Animal.findOne({isDeleted: false}).sort({ createdAt: -1 });
    if (!animal) throw new Error("No animal found in DB");
    const seller = await User.findById(animal.sellerId);
    let reporter = await User.findOne({ _id: { $ne: seller._id } }) || seller;
    console.log(`Prepared Test Data - Animal: ${animal._id}, Reporter: ${reporter._id}`);

    await Complaint.deleteMany({ animalId: animal._id, reporterId: reporter._id });

    // Generate real token using backend util
    const token = generateToken({ id: reporter._id, role: reporter.role });

    const payload = {
      animalId: animal._id,
      message: 'Investigation test complaint message - something is wrong here.'
    };
    
    console.log('\n--- 1. MOBILE POST TEST ---');
    console.log('POST URL:', `${API_URL}/complaints`);
    console.log('Payload:', JSON.stringify(payload));
    
    let postResponse;
    try {
      postResponse = await axios.post(`${API_URL}/complaints`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('HTTP Status Code:', postResponse.status);
      console.log('Response Body:', JSON.stringify(postResponse.data));
    } catch (err) {
      console.error('POST Error:', err.response ? err.response.data : err.message);
      return;
    }

    console.log('\n--- 2 & 3. MONGODB VERIFICATION ---');
    const insertedId = postResponse.data.data._id;
    const dbComplaint = await Complaint.findById(insertedId);
    
    if (dbComplaint) {
      console.log('✅ Complaint successfully found in MongoDB!');
      console.log('MongoDB Document:', JSON.stringify(dbComplaint));
    } else {
      console.log('❌ Complaint NOT FOUND in MongoDB!');
    }

    console.log('\n--- 4. ADMIN GET TEST ---');
    const admin = await User.findOne({ role: 'super-admin' }) || await User.findOne();
    const adminToken = generateToken({ id: admin._id, role: 'super-admin' });
    
    try {
      console.log('\nTrying /api/complaints GET directly...');
      const getRes2 = await axios.get(`${API_URL}/complaints`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('HTTP Status Code:', getRes2.status);
      const list = getRes2.data.data;
      console.log(`Total complaints returned by API: ${list.length}`);
      
      const found = list.find(c => c._id.toString() === insertedId.toString());
      if (found) {
        console.log('✅ New complaint is PRESENT in the GET /api/complaints response.');
      } else {
        console.log('❌ New complaint is MISSING from the GET /api/complaints response!');
        console.log('List returned size:', list.length);
      }
    } catch(e) {
      console.error('GET /api/complaints Error:', e.response ? e.response.data : e.message);
    }

    console.log('\n--- 5. ENVIRONMENT ---');
    console.log('Backend Port from env:', process.env.PORT);
    console.log('MongoDB URI:', (process.env.MONGO_URI || '').replace(/:([^:@]{3,})@/, ':***@'));

  } catch (error) {
    console.error('Script Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

runInvestigation();
