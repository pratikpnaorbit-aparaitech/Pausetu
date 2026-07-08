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
    { name: 'Jersey', description: 'High milk fat producing breed' }
  ],
  buffalo: [
    { name: 'Murrah', description: 'Premier dairy buffalo breed from Haryana' },
    { name: 'Jaffarabadi', description: 'Very large sized buffalo breed from Gujarat' },
    { name: 'Mehsana', description: 'High yield dairy buffalo breed' }
  ],
  goat: [
    { name: 'Osmanabadi', description: 'Highly prolific meat and milk breed from Maharashtra' },
    { name: 'Boer', description: 'Fast growing premium meat breed' },
    { name: 'Sirohi', description: 'Highly adaptable breed originating from Rajasthan' }
  ],
  sheep: [
    { name: 'Deccani', description: 'Well adapted to Deccan plateau conditions' },
    { name: 'Nellore', description: 'Tallest sheep breed in India' }
  ],
  horse: [
    { name: 'Marwari', description: 'Famous Indian horse breed with inward-turning ears' },
    { name: 'Kathiawari', description: 'Resilient breed originating from Gujarat' }
  ]
};

// Hierarchical location sample data
const statesData = [
  {
    name: 'Maharashtra',
    districts: [
      {
        name: 'Satara',
        talukas: [
          {
            name: 'Karad',
            villages: ['Wather', 'Vithalpur', 'Ond', 'Kole']
          },
          {
            name: 'Koregaon',
            villages: ['Kumtha', 'Latur', 'Jalgaon', 'Koregaon Village']
          }
        ]
      },
      {
        name: 'Pune',
        talukas: [
          {
            name: 'Baramati',
            villages: ['Shirsuphal', 'Kanheri', 'Jalochi']
          },
          {
            name: 'Haveli',
            villages: ['Wagholi', 'Manjri', 'Hadapsar']
          }
        ]
      }
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
    // 1. Seed Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[SEED] Seeding default categories...');
      const createdCategories = await Category.insertMany(categoriesData);

      // 2. Seed Breeds based on category mapping
      console.log('[SEED] Seeding default breeds...');
      for (const cat of createdCategories) {
        const slug = cat.slug;
        if (breedsData[slug]) {
          const breedsToInsert = breedsData[slug].map((b) => ({
            ...b,
            categoryId: cat._id
          }));
          await Breed.insertMany(breedsToInsert);
        }
      }
      console.log('[SEED] Categories and Breeds seeded successfully.');
    }

    // 3. Seed States, Districts, Talukas, Villages
    const stateCount = await State.countDocuments();
    if (stateCount === 0) {
      console.log('[SEED] Seeding location hierarchy data...');
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
