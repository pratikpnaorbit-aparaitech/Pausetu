const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newKeys = {
  en: {
    sell: {
      contactBuyerTitle: "{{action}} Buyer",
      contactBuyerMsg: "Opening {{action}} interface for {{buyerName}}.",
      postedAgo: "Posted {{time}}"
    }
  },
  hi: {
    sell: {
      contactBuyerTitle: "खरीदार से संपर्क करें ({{action}})",
      contactBuyerMsg: "{{buyerName}} के लिए {{action}} इंटरफ़ेस खोला जा रहा है।",
      postedAgo: "{{time}} पहले पोस्ट किया गया"
    }
  },
  mr: {
    sell: {
      contactBuyerTitle: "खरेदीदाराशी संपर्क साधा ({{action}})",
      contactBuyerMsg: "{{buyerName}} साठी {{action}} इंटरफेस उघडत आहे.",
      postedAgo: "{{time}} पूर्वी पोस्ट केले"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.sell) content.sell = {};
    Object.assign(content.sell, newKeys[lang].sell);
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged sell extra translations into ${lang}.json`);
  }
});
