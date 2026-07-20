const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newKeys = {
  en: {
    buy: {
      marketplaceCare: "Cattle Market"
    }
  },
  hi: {
    buy: {
      marketplaceCare: "पशु बाज़ार"
    }
  },
  mr: {
    buy: {
      marketplaceCare: "जनावर बाजार"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.buy) content.buy = {};
    Object.assign(content.buy, newKeys[lang].buy);
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged buy translations into ${lang}.json`);
  }
});
