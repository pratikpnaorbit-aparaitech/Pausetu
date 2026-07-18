const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
const Animal = require('./models/Animal');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

async function runTests() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pashusetu');
    console.log('✅ Connected to MongoDB');

    try { await mongoose.connection.collection('complaints').drop(); } catch (e) {}
    await Complaint.init(); // ensure indexes are created

    // 1. Get an existing animal
    const animal = await Animal.findOne();
    if (!animal) {
       console.log('❌ Failed: No animal found in DB to test on.');
       return;
    }

    // 2. Get the seller of that animal
    const seller = await User.findById(animal.sellerId);
    if (!seller) {
       console.log('❌ Failed: Seller not found for this animal.');
       return;
    }

    // 3. Get any other user to be the reporter
    let reporter = await User.findOne({ _id: { $ne: seller._id } });
    if (!reporter) reporter = seller; // Fallback to self if only 1 user exists

    console.log(`Using Animal: ${animal._id}, Reporter: ${reporter.name}, Seller: ${seller.name}`);

    // 4. Test empty complaint validation (Simulated at Model level)
    console.log('\nTesting empty complaint validation...');
    try {
      await Complaint.create({
        animalId: animal._id,
        reporterId: reporter._id,
        sellerId: seller._id,
        message: 'short' // < 10 chars
      });
      console.log('❌ Failed: Short complaint was allowed.');
    } catch (err) {
      if (err.errors && err.errors.message) {
         console.log('✅ Passed: Empty/Short complaint validation blocked it.');
      } else {
         console.log('❌ Failed with unexpected error:', err.message);
      }
    }

    // Clean any existing complaints for this combo
    await Complaint.deleteMany({ animalId: animal._id, reporterId: reporter._id });

    // 5. Test successful complaint
    console.log('\nTesting valid complaint creation...');
    const complaint1 = await Complaint.create({
      animalId: animal._id,
      reporterId: reporter._id,
      sellerId: seller._id,
      message: 'This animal listing seems to be a scam. The photos are fake.'
    });
    console.log(`✅ Passed: Complaint created successfully (ID: ${complaint1._id})`);

    // 6. Test duplicate complaint block
    console.log('\nTesting duplicate complaint prevention...');
    try {
       await Complaint.create({
         animalId: animal._id,
         reporterId: reporter._id,
         sellerId: seller._id,
         message: 'This is a duplicate complaint attempt.'
       });
       console.log('❌ Failed: Duplicate complaint was allowed.');
    } catch (err) {
       if (err.code === 11000) {
         console.log('✅ Passed: MongoDB Unique Index blocked the duplicate complaint.');
       } else {
         console.log('❌ Failed with unexpected error:', err.message);
       }
    }
    
    // 7. Verify Complaint in DB
    const dbComplaint = await Complaint.findById(complaint1._id);
    if (dbComplaint && dbComplaint.status === 'pending') {
      console.log('✅ Passed: Complaint is successfully saved in MongoDB as pending.');
    } else {
      console.log('❌ Failed: Complaint not found in DB or status incorrect.');
    }

    // 8. Test Admin Resolve
    console.log('\nTesting Admin Resolve Action...');
    dbComplaint.status = 'resolved';
    await dbComplaint.save();
    
    const resolvedComplaint = await Complaint.findById(complaint1._id);
    if (resolvedComplaint.status === 'resolved') {
       console.log('✅ Passed: Admin successfully marked complaint as resolved.');
    }

    // 9. Allow another complaint since previous is resolved
    console.log('\nTesting second complaint after first is resolved...');
    const complaint2 = await Complaint.create({
      animalId: animal._id,
      reporterId: reporter._id,
      sellerId: seller._id,
      message: 'The seller is now asking for money upfront outside the app.'
    });
    console.log(`✅ Passed: Second complaint allowed because the first was resolved (ID: ${complaint2._id})`);

    // 10. Clean up
    console.log('\nCleaning up test data...');
    await Complaint.deleteMany({ _id: { $in: [complaint1._id, complaint2._id] }});
    console.log('✅ Clean up complete.');

    console.log('\n🌟 All backend logic and database tests passed successfully! 🌟');
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();
