const Category = require('../models/Category');
const Breed = require('../models/Breed');
const { State, District, Taluka, Village } = require('../models/Location');

const categoriesData = [
  { name: 'Cow', slug: 'cow', description: 'Cows of various indigenous and foreign breeds', sortOrder: 1 },
  { name: 'Buffalo', slug: 'buffalo', description: 'Dairy and draught buffalo breeds', sortOrder: 2 },
  { name: 'Goat', slug: 'goat', description: 'Goats for dairy and meat purposes', sortOrder: 3 },
  { name: 'Sheep', slug: 'sheep', description: 'Sheep breeds for wool and meat', sortOrder: 4 },
  { name: 'Horse', slug: 'horse', description: 'Equine categories', sortOrder: 5 },
  { name: 'Other', slug: 'other', description: 'Other domestic animals', sortOrder: 6 }
];

const breedsData = {
  cow: [
    { name: 'Gir', description: 'Highly popular dairy breed originating from Gir hills' },
    { name: 'Sahiwal', description: 'One of the best dairy breeds in India' },
    { name: 'HF', description: 'Holstein Friesian high milk production breed' },
    { name: 'Jersey', description: 'High milk fat producing breed' },
    { name: 'Red Sindhi', description: 'Indigenous dairy cow breed' },
    { name: 'Tharparkar', description: 'Dual-purpose dairy and draught breed' },
    { name: 'Rathi', description: 'Milch cattle breed of Rajasthan' },
    { name: 'Kankrej', description: 'Heavy draught and dairy breed' },
    { name: 'Deoni', description: 'Dual-purpose breed from Maharashtra' },
    { name: 'Dangi', description: 'Hardy draught breed from Western Ghats' },
    { name: 'Khillar', description: 'Fast draught breed from Maharashtra' },
    { name: 'Gaolao', description: 'Draught breed from Central India' },
    { name: 'Lal Kandhari', description: 'Medium sized draught breed' },
    { name: 'Krishna Valley', description: 'Heavy draught cow breed' },
    { name: 'Crossbreed', description: 'Mixed dairy breed' },
    { name: 'Desi', description: 'Local indigenous cow' },
    { name: 'Other', description: 'Other cow breed' }
  ],
  buffalo: [
    { name: 'Murrah', description: 'Premier dairy buffalo breed from Haryana' },
    { name: 'Jaffarabadi', description: 'Very large sized buffalo breed from Gujarat' },
    { name: 'Pandharpuri', description: 'High yielding dairy buffalo from Maharashtra' },
    { name: 'Nagpuri', description: 'Draught and dairy buffalo breed' },
    { name: 'Surti', description: 'Medium sized dairy buffalo breed' },
    { name: 'Mehsana', description: 'High yield dairy buffalo breed' },
    { name: 'Bhadawari', description: 'High milk fat buffalo breed' },
    { name: 'Nili-Ravi', description: 'Dairy buffalo breed' },
    { name: 'Toda', description: 'Hilly terrain buffalo breed' },
    { name: 'Marathwadi', description: 'Hardy regional buffalo breed' },
    { name: 'Crossbreed', description: 'Mixed buffalo breed' },
    { name: 'Desi', description: 'Local indigenous buffalo' },
    { name: 'Other', description: 'Other buffalo breed' }
  ],
  goat: [
    { name: 'Osmanabadi', description: 'Highly prolific meat and milk breed from Maharashtra' },
    { name: 'Sangamneri', description: 'Dual-purpose goat breed' },
    { name: 'Boer', description: 'Fast growing premium meat breed' },
    { name: 'Sirohi', description: 'Highly adaptable breed originating from Rajasthan' },
    { name: 'Jamunapari', description: 'Tall Indian dairy goat breed' },
    { name: 'Beetal', description: 'Large dairy goat breed' },
    { name: 'Black Bengal', description: 'Prolific meat goat breed' },
    { name: 'Barbari', description: 'Dual-purpose compact goat breed' },
    { name: 'Jakhrana', description: 'High milk yield goat breed' },
    { name: 'Malabari', description: 'Coastal goat breed' },
    { name: 'Sojat', description: 'Large meat goat breed' },
    { name: 'Ganjam', description: 'Hardy meat goat breed' },
    { name: 'Crossbreed', description: 'Mixed goat breed' },
    { name: 'Desi', description: 'Local indigenous goat' },
    { name: 'Other', description: 'Other goat breed' }
  ],
  sheep: [
    { name: 'Deccani', description: 'Well adapted to Deccan plateau conditions' },
    { name: 'Madgyal', description: 'Popular large sheep breed from Sangli' },
    { name: 'Lonand', description: 'Regional meat sheep breed' },
    { name: 'Sangamneri', description: 'Regional sheep breed' },
    { name: 'Nellore', description: 'Tallest sheep breed in India' },
    { name: 'Marwari', description: 'Hardy wool and meat sheep breed' },
    { name: 'Mandya', description: 'Compact meat sheep breed' },
    { name: 'Bellary', description: 'Medium sized sheep breed' },
    { name: 'Patanwadi', description: 'Wool producing sheep breed' },
    { name: 'Malpura', description: 'Rugged sheep breed' },
    { name: 'Crossbreed', description: 'Mixed sheep breed' },
    { name: 'Desi', description: 'Local indigenous sheep' },
    { name: 'Other', description: 'Other sheep breed' }
  ],
  horse: [
    { name: 'Marwari', description: 'Famous Indian horse breed with inward-turning ears' },
    { name: 'Kathiawari', description: 'Resilient breed originating from Gujarat' },
    { name: 'Spiti', description: 'Himalayan mountain horse breed' },
    { name: 'Bhutia', description: 'Mountain pack horse breed' },
    { name: 'Manipuri', description: 'Famous Indian polo pony and riding breed' },
    { name: 'Zanskari', description: 'High altitude mountain horse breed' },
    { name: 'Thoroughbred', description: 'High speed athletic horse breed' },
    { name: 'Arabian', description: 'Classic endurance horse breed' },
    { name: 'Quarter Horse', description: 'Versatile riding horse breed' },
    { name: 'Friesian', description: 'Draft and riding horse breed' },
    { name: 'Other', description: 'Other equine breed' }
  ]
};

// Hierarchical location data - complete Maharashtra 36 districts and Gujarat Anand
const statesData = [
  {
    name: 'Maharashtra',
    districts: [
      { name: 'Ahmednagar', talukas: [{ name: 'Ahmednagar', villages: ['Savedi', 'Kedgaon'] }, { name: 'Sangamner', villages: ['Ghulewadi', 'Kolhar'] }, { name: 'Shrirampur', villages: ['Belapur', 'Taklimiya'] }, { name: 'Rahuri', villages: ['Deolali Pravara', 'Sakharwadi'] }, { name: 'Kopargaon', villages: ['Shirdi', 'Sanjvani'] }] },
      { name: 'Akola', talukas: [{ name: 'Akola', villages: ['Umri', 'Shivar'] }, { name: 'Balapur', villages: ['Paras', 'Patur'] }, { name: 'Akot', villages: ['Chohota Bazar', 'Adgaon'] }, { name: 'Murtizapur', villages: ['Mana', 'Karanjha'] }] },
      { name: 'Amravati', talukas: [{ name: 'Amravati', villages: ['Badnera', 'Rahatgaon'] }, { name: 'Achalpur', villages: ['Paratwada', 'Chandur'] }, { name: 'Morshi', villages: ['Pala', 'Dhamangaon'] }, { name: 'Warud', villages: ['Shendurjana', 'Benoda'] }] },
      { name: 'Aurangabad', talukas: [{ name: 'Aurangabad', villages: ['Chikhalthana', 'Harsul'] }, { name: 'Paithan', villages: ['Bidkin', 'Pachod'] }, { name: 'Vaijapur', villages: ['Rotegaon', 'Khandala'] }, { name: 'Sillod', villages: ['Ajanta', 'Golegaon'] }] },
      { name: 'Beed', talukas: [{ name: 'Beed', villages: ['Nalwandi', 'Pali'] }, { name: 'Ambajogai', villages: ['Ghatnandur', 'Morewadi'] }, { name: 'Georai', villages: ['Pachod', 'Umapur'] }, { name: 'Parli', villages: ['Pangri', 'Dharmapuri'] }] },
      { name: 'Bhandara', talukas: [{ name: 'Bhandara', villages: ['Kardi', 'Shahapur'] }, { name: 'Tumsar', villages: ['Sihora', 'Mohadi'] }, { name: 'Pauni', villages: ['Adyar', 'Asgaon'] }, { name: 'Sakoli', villages: ['Sendurwafa', 'Lakhani'] }] },
      { name: 'Buldhana', talukas: [{ name: 'Buldhana', villages: ['Chikhli', 'Dhad'] }, { name: 'Shegaon', villages: ['Alasna', 'Jalamb'] }, { name: 'Khamgaon', villages: ['Sutala', 'Pimpalgaon'] }, { name: 'Malkapur', villages: ['Dharangaon', 'Nandura'] }] },
      { name: 'Chandrapur', talukas: [{ name: 'Chandrapur', villages: ['Padmapur', 'Ghugus'] }, { name: 'Warora', villages: ['Shegaon', 'Bhadrawati'] }, { name: 'Ballarpur', villages: ['Visapur', 'Rajura'] }, { name: 'Mul', villages: ['Somnath', 'Sindewahi'] }] },
      { name: 'Dhule', talukas: [{ name: 'Dhule', villages: ['Deopur', 'Laling'] }, { name: 'Sakri', villages: ['Pimpalner', 'Dahiwel'] }, { name: 'Shirpur', villages: ['Thalner', 'Vikhran'] }, { name: 'Sindkheda', villages: ['Dondaicha', 'Nardana'] }] },
      { name: 'Gadchiroli', talukas: [{ name: 'Gadchiroli', villages: ['Mulchera', 'Dhanora'] }, { name: 'Aheri', villages: ['Allapalli', 'Sironcha'] }, { name: 'Chamorshi', villages: ['Ashti', 'Ghot'] }, { name: 'Armori', villages: ['Kurkheda', 'Desaiganj'] }] },
      { name: 'Gondia', talukas: [{ name: 'Gondia', villages: ['Kudwa', 'Goregaon'] }, { name: 'Tirora', villages: ['Mundikota', 'Amgaon'] }, { name: 'Arjuni Morgaon', villages: ['Navegaon', 'Sadak Arjuni'] }] },
      { name: 'Hingoli', talukas: [{ name: 'Hingoli', villages: ['Limbala', 'Kalamnuri'] }, { name: 'Basmath', villages: ['Hatta', 'Sengaon'] }] },
      { name: 'Jalgaon', talukas: [{ name: 'Jalgaon', villages: ['Dharangaon', 'Paldhi'] }, { name: 'Bhusawal', villages: ['Varangaon', 'Bodwad'] }, { name: 'Chalisgaon', villages: ['Bhiradi', 'Patonda'] }, { name: 'Amalner', villages: ['Marwad', 'Chopda'] }] },
      { name: 'Jalna', talukas: [{ name: 'Jalna', villages: ['Rajur', 'Ghansawangi'] }, { name: 'Bhokardan', villages: ['Sillod', 'Jafrabad'] }, { name: 'Partur', villages: ['Mantha', 'Ambad'] }] },
      { name: 'Kolhapur', talukas: [{ name: 'Kolhapur', villages: ['Karvir', 'Uchgaon'] }, { name: 'Ichalkaranji', villages: ['Hupari', 'Jaisingpur'] }, { name: 'Panhala', villages: ['Kodoli', 'Gaganbawada'] }, { name: 'Shahuwadi', villages: ['Malkapur', 'Bambavade'] }] },
      { name: 'Latur', talukas: [{ name: 'Latur', villages: ['Murud', 'Harangul'] }, { name: 'Udgir', villages: ['Deoni', 'Jalkot'] }, { name: 'Ahmedpur', villages: ['Kingaon', 'Shirur Tajband'] }, { name: 'Nilanga', villages: ['Aurad', 'Ausa'] }] },
      { name: 'Mumbai City', talukas: [{ name: 'South Mumbai', villages: ['Colaba', 'Fort', 'Nariman Point'] }, { name: 'Central Mumbai', villages: ['Dadar', 'Sion', 'Byculla'] }] },
      { name: 'Mumbai Suburban', talukas: [{ name: 'Kurla', villages: ['Ghatkopar', 'Chembur'] }, { name: 'Andheri', villages: ['Bandra', 'Juhu', 'Versova'] }, { name: 'Borivali', villages: ['Dahisar', 'Kandivali'] }] },
      { name: 'Nagpur', talukas: [{ name: 'Nagpur', villages: ['Kalmeshwar', 'Kamptee'] }, { name: 'Katol', villages: ['Narkhed', 'Saoner'] }, { name: 'Ramtek', villages: ['Parseoni', 'Mauda'] }, { name: 'Umred', villages: ['Bhiwapur', 'Kuhi'] }] },
      { name: 'Nanded', talukas: [{ name: 'Nanded', villages: ['Waghala', 'Ardhapur'] }, { name: 'Mukhed', villages: ['Degloor', 'Biloli'] }, { name: 'Kandhar', villages: ['Loha', 'Mudkhed'] }, { name: 'Bhokar', villages: ['Himayatnagar', 'Hadgaon'] }] },
      { name: 'Nandurbar', talukas: [{ name: 'Nandurbar', villages: ['Kondaibari', 'Shahada'] }, { name: 'Taloda', villages: ['Akkalkuwa', 'Dhadgaon'] }] },
      { name: 'Nashik', talukas: [{ name: 'Nashik', villages: ['Deolali', 'Eklahare'] }, { name: 'Malegaon', villages: ['Manmad', 'Chandwad'] }, { name: 'Sinnar', villages: ['Musalgaon', 'Ghoti'] }, { name: 'Niphad', villages: ['Lasalgaon', 'Pimpalgaon'] }, { name: 'Yeola', villages: ['Ankai', 'Kopargaon'] }] },
      { name: 'Osmanabad', talukas: [{ name: 'Osmanabad', villages: ['Dhoki', 'Tuljapur'] }, { name: 'Umarga', villages: ['Lohara', 'Kalamb'] }] },
      { name: 'Palghar', talukas: [{ name: 'Palghar', villages: ['Boisar', 'Saphale'] }, { name: 'Dahanu', villages: ['Vangaon', 'Jawhar'] }, { name: 'Vasai', villages: ['Virar', 'Nallasopara'] }, { name: 'Wada', villages: ['Vikramgad', 'Mokhada'] }] },
      { name: 'Parbhani', talukas: [{ name: 'Parbhani', villages: ['Pingli', 'Gangakhed'] }, { name: 'Jintur', villages: ['Bori', 'Sailu'] }] },
      { name: 'Pune', talukas: [{ name: 'Baramati', villages: ['Shirsuphal', 'Kanheri', 'Jalochi'] }, { name: 'Haveli', villages: ['Wagholi', 'Manjri', 'Hadapsar'] }, { name: 'Khed', villages: ['Chakan', 'Rajgurunagar'] }, { name: 'Shirur', villages: ['Ranjangaon', 'Shikrapur'] }, { name: 'Maval', villages: ['Lonavala', 'Talegaon'] }] },
      { name: 'Raigad', talukas: [{ name: 'Alibag', villages: ['Khandala', 'Revdanda'] }, { name: 'Panvel', villages: ['Kharghar', 'Taloja'] }, { name: 'Karjat', villages: ['Neral', 'Khopoli'] }, { name: 'Mahad', villages: ['Poladpur', 'Mangaon'] }] },
      { name: 'Ratnagiri', talukas: [{ name: 'Ratnagiri', villages: ['Ganpatipule', 'Pawawas'] }, { name: 'Chiplun', villages: ['Guhagar', 'Sangameshwar'] }, { name: 'Dapoli', villages: ['Mandangad', 'Khed'] }] },
      { name: 'Sangli', talukas: [{ name: 'Miraj', villages: ['Sangli City', 'Kupwad'] }, { name: 'Tasgaon', villages: ['Palus', 'Kavathe Mahankal'] }, { name: 'Jath', villages: ['Shirala', 'Khanapur'] }] },
      { name: 'Satara', talukas: [{ name: 'Karad', villages: ['Wather', 'Vithalpur', 'Ond', 'Kole'] }, { name: 'Koregaon', villages: ['Kumtha', 'Latur', 'Jalgaon', 'Koregaon Village'] }, { name: 'Satara', villages: ['Wai', 'Mahabaleshwar', 'Phaltan'] }] },
      { name: 'Sindhudurg', talukas: [{ name: 'Sawantwadi', villages: ['Amboli', 'Banda'] }, { name: 'Kudal', villages: ['Oros', 'Vengurla'] }, { name: 'Malvan', villages: ['Devgad', 'Kankavali'] }] },
      { name: 'Solapur', talukas: [{ name: 'Solapur', villages: ['Mohol', 'Akkalkot'] }, { name: 'Pandharpur', villages: ['Sangola', 'Mangalwedha'] }, { name: 'Barshi', villages: ['Kurduwadi', 'Madha'] }] },
      { name: 'Thane', talukas: [{ name: 'Thane', villages: ['Kalwa', 'Mumbra'] }, { name: 'Kalyan', villages: ['Dombivli', 'Ulhasnagar', 'Ambernath'] }, { name: 'Shahapur', villages: ['Murbad', 'Bhiwandi'] }] },
      { name: 'Wardha', talukas: [{ name: 'Wardha', villages: ['Sewagram', 'Seloo'] }, { name: 'Hinganghat', villages: ['Pulgaon', 'Deoli'] }] },
      { name: 'Washim', talukas: [{ name: 'Washim', villages: ['Risod', 'Malegaon'] }, { name: 'Karanja', villages: ['Mangrulpir', 'Manora'] }] },
      { name: 'Yavatmal', talukas: [{ name: 'Yavatmal', villages: ['Darwha', 'Arni'] }, { name: 'Pusad', villages: ['Umarkhed', 'Digras'] }] }
    ]
  },
  {
    name: 'Gujarat',
    districts: [
      {
        name: 'Anand',
        talukas: [
          {
            name: 'Anand Taluka',
            villages: ['Hadgood', 'Lambhvel', 'Mogar']
          }
        ]
      }
    ]
  }
];

/**
 * Automatical Seeding function to populate master databases
 */
const autoSeed = async () => {
  try {
    // 1. Seed Categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[SEED] Seeding default categories...');
      await Category.insertMany(categoriesData);
      console.log('[SEED] Categories seeded successfully.');
    }

    // 2. Ensure all breeds in breedsData exist in the database
    const allCategories = await Category.find();
    for (const cat of allCategories) {
      const slug = cat.slug;
      if (breedsData[slug]) {
        for (const b of breedsData[slug]) {
          const existing = await Breed.findOne({ categoryId: cat._id, name: b.name });
          if (!existing) {
            await Breed.create({ ...b, categoryId: cat._id });
            console.log(`[SEED] Added missing breed '${b.name}' for category '${cat.name}'`);
          }
        }
      }
    }

    // 3. Seed States, Districts, Talukas, Villages (Self-healing re-seed check)
    const districtCount = await District.countDocuments();
    if (districtCount < 30) {
      console.log('[SEED] Incomplete location master data detected. Re-seeding...');
      
      // Clear existing location tables
      await State.deleteMany({});
      await District.deleteMany({});
      await Taluka.deleteMany({});
      await Village.deleteMany({});
      
      for (const sData of statesData) {
        const state = await State.create({ name: sData.name });
        
        for (const dData of sData.districts) {
          const district = await District.create({
            stateId: state._id,
            name: dData.name
          });

          for (const tData of dData.talukas) {
            const taluka = await Taluka.create({
              districtId: district._id,
              name: tData.name
            });

            for (const vName of tData.villages) {
              await Village.create({
                talukaId: taluka._id,
                name: vName
              });
            }
          }
        }
      }
      console.log('[SEED] Location data hierarchy seeded successfully.');
    }
  } catch (error) {
    console.error(`[SEED ERROR] Seeding master data failed: ${error.message}`);
  }
};

module.exports = autoSeed;
