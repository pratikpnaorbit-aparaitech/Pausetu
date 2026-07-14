// merge_locales_market_price.js
// Script to merge guided market price chatbot translations for English, Hindi, and Marathi.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    tabs: {
      marketPrice: "Market Price"
    },
    estimator: {
      chat: {
        qAnimal: "Which animal do you want to estimate?",
        qBreed: "What is the breed of your {{animal}}?",
        qAge: "How old is your {{animal}}?",
        qWeight: "What is the approximate weight of your {{animal}}?",
        qMilk: "What is the daily milk production of your {{animal}}?",
        qHealth: "What is the health condition of your {{animal}}?",
        qDistrict: "Select your district or nearest market:",
        summaryCard: "📝 Animal Selection Summary",
        analyzing: "⚡ Analyzing market value...",
        ageOptions: {
          lt_6m: "< 6 Months",
          "6_12m": "6-12 Months",
          "1_2y": "1-2 Years",
          "2_3y": "2-3 Years",
          "3_5y": "3-5 Years",
          "5_7y": "5-7 Years",
          gt_3y: "3+ Years",
          gt_7y: "7+ Years"
        },
        weightOptions: {
          w10_20: "10-20 kg",
          w20_30: "20-30 kg",
          w30_40: "30-40 kg",
          w40_50: "40-50 kg",
          w50_plus: "50+ kg",
          w150_250: "150-250 kg",
          w250_350: "250-350 kg",
          w350_450: "350-450 kg",
          w450_plus: "450+ kg",
          w450_550: "450-550 kg",
          w550_plus: "550+ kg"
        },
        milkOptions: {
          m0: "0 Litres (Dry/Male)",
          m1_5: "1-5 L/day",
          m5_10: "5-10 L/day",
          m10_15: "10-15 L/day",
          m15_20: "15-20 L/day",
          m20_plus: "20+ L/day"
        },
        districtOptions: {
          pune: "Pune (MH)",
          satara: "Satara (MH)",
          ahmednagar: "Ahmednagar (MH)",
          anand: "Anand (GJ)",
          jaipur: "Jaipur (RJ)",
          lucknow: "Lucknow (UP)",
          other: "Other Region"
        }
      }
    }
  },
  hi: {
    tabs: {
      marketPrice: "बाज़ार भाव"
    },
    estimator: {
      chat: {
        qAnimal: "आप किस पशु का मूल्य आंकना चाहते हैं?",
        qBreed: "आपके {{animal}} की नस्ल क्या है?",
        qAge: "आपके {{animal}} की उम्र क्या है?",
        qWeight: "आपके {{animal}} का अनुमानित वजन कितना है?",
        qMilk: "आपके {{animal}} का दैनिक दूध उत्पादन कितना है?",
        qHealth: "आपके {{animal}} के स्वास्थ्य की स्थिति कैसी है?",
        qDistrict: "अपने जिले या निकटतम बाजार का चयन करें:",
        summaryCard: "📝 पशु चयन सारांश",
        analyzing: "⚡ बाजार मूल्य का विश्लेषण किया जा रहा है...",
        ageOptions: {
          lt_6m: "6 महीने से कम",
          "6_12m": "6-12 महीने",
          "1_2y": "1-2 वर्ष",
          "2_3y": "2-3 वर्ष",
          "3_5y": "3-5 वर्ष",
          "5_7y": "5-7 वर्ष",
          gt_3y: "3 वर्ष से अधिक",
          gt_7y: "7 वर्ष से अधिक"
        },
        weightOptions: {
          w10_20: "10-20 किलोग्राम",
          w20_30: "20-30 किलोग्राम",
          w30_40: "30-40 किलोग्राम",
          w40_50: "40-50 किलोग्राम",
          w50_plus: "50+ किलोग्राम",
          w150_250: "150-250 किलोग्राम",
          w250_350: "250-350 किलोग्राम",
          w350_450: "350-450 किलोग्राम",
          w450_plus: "450+ किलोग्राम",
          w450_550: "450-550 किलोग्राम",
          w550_plus: "550+ किलोग्राम"
        },
        milkOptions: {
          m0: "0 लीटर (दूध नहीं/नर)",
          m1_5: "1-5 लीटर/दिन",
          m5_10: "5-10 लीटर/दिन",
          m10_15: "10-15 लीटर/दिन",
          m15_20: "15-20 लीटर/दिन",
          m20_plus: "20+ लीटर/दिन"
        },
        districtOptions: {
          pune: "पुणे (महाराष्ट्र)",
          satara: "सतारा (महाराष्ट्र)",
          ahmednagar: "अहमदनगर (महाराष्ट्र)",
          anand: "आनंद (गुजरात)",
          jaipur: "जयपुर (राजस्थान)",
          lucknow: "लखनऊ (उत्तर प्रदेश)",
          other: "अन्य क्षेत्र"
        }
      }
    }
  },
  mr: {
    tabs: {
      marketPrice: "बाजारभाव"
    },
    estimator: {
      chat: {
        qAnimal: "तुम्हाला कोणत्या पशूचे मूल्यमापन करायचे आहे?",
        qBreed: "तुमच्या {{animal}} ची जात काय आहे?",
        qAge: "तुमच्या {{animal}} चे वय किती आहे?",
        qWeight: "तुमच्या {{animal}} चे अंदाजे वजन किती आहे?",
        qMilk: "तुमच्या {{animal}} चे दररोजचे दूध उत्पादन किती आहे?",
        qHealth: "तुमच्या {{animal}} ची आरोग्य स्थिती कशी आहे?",
        qDistrict: "तुमचा जिल्हा किंवा जवळची बाजारपेठ निवडा:",
        summaryCard: "📝 पशु निवड सारांश",
        analyzing: "⚡ बाजार भावाचे विश्लेषण केले जात आहे...",
        ageOptions: {
          lt_6m: "6 महिन्यांपेक्षा कमी",
          "6_12m": "6-12 महिने",
          "1_2y": "1-2 वर्षे",
          "2_3y": "2-3 वर्षे",
          "3_5y": "3-5 वर्षे",
          "5_7y": "5-7 वर्षे",
          gt_3y: "3 वर्षांपेक्षा जास्त",
          gt_7y: "7 वर्षांपेक्षा जास्त"
        },
        weightOptions: {
          w10_20: "10-20 किलो",
          w20_30: "20-30 किलो",
          w30_40: "30-40 किलो",
          w40_50: "40-50 किलो",
          w50_plus: "50+ किलो",
          w150_250: "150-250 किलो",
          w250_350: "250-350 किलो",
          w350_450: "350-450 किलो",
          w450_plus: "450+ किलो",
          w450_550: "450-550 किलो",
          w550_plus: "550+ किलो"
        },
        milkOptions: {
          m0: "0 लीटर (दूध नाही/नर)",
          m1_5: "1-5 लीटर/दिवस",
          m5_10: "5-10 लीटर/दिवस",
          m10_15: "10-15 लीटर/दिवस",
          m15_20: "15-20 लीटर/दिवस",
          m20_plus: "20+ लीटर/दिवस"
        },
        districtOptions: {
          pune: "पुणे (महाराष्ट्र)",
          satara: "सातारा (महाराष्ट्र)",
          ahmednagar: "अहमदनगर (महाराष्ट्र)",
          anand: "आनंद (गुजरात)",
          jaipur: "जयपूर (राजस्थान)",
          lucknow: "लखनऊ (उत्तर प्रदेश)",
          other: "इतर परिसर"
        }
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    // Merge tabs
    if (!content.tabs) content.tabs = {};
    Object.assign(content.tabs, newData[lang].tabs);
    
    // Merge estimator
    if (!content.estimator) content.estimator = {};
    if (!content.estimator.chat) content.estimator.chat = {};
    Object.assign(content.estimator.chat, newData[lang].estimator.chat);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged market price translations into ${lang}.json`);
  }
});
