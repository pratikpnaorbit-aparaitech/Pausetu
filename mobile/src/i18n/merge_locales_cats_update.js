// merge_locales_cats_update.js
// Adds customized localizations for Bull, Calf, Bullock, and Other.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    buy: {
      bull: "Bull 🐂",
      calf: "Calf 🍼",
      bullock: "Bullock 🐂",
      other: "Other 🐾"
    }
  },
  hi: {
    buy: {
      bull: "सांड 🐂",
      calf: "बछड़ा 🍼",
      bullock: "बैल 🐂",
      other: "अन्य 🐾"
    }
  },
  mr: {
    buy: {
      bull: "वळू 🐂",
      calf: "वासरू 🍼",
      bullock: "बैल 🐂",
      other: "इतर 🐾"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.buy) content.buy = {};
    
    // Clean old unused categories
    delete content.buy.chicken;
    delete content.buy.pig;
    delete content.buy.camel;

    Object.assign(content.buy, newData[lang].buy);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged new target categories into ${lang}.json`);
  }
});
