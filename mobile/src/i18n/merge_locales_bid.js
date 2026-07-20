const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newKeys = {
  en: {
    bid: {
      title: "Live Bidding",
      subtitle: "Place bids on active livestock auctions and track deals."
    }
  },
  hi: {
    bid: {
      title: "लाइव बोली (Bidding)",
      subtitle: "सक्रिय पशुधन नीलामियों पर बोली लगाएं और सौदों को ट्रैक करें।"
    }
  },
  mr: {
    bid: {
      title: "थेट बोली (Bidding)",
      subtitle: "सक्रिय पशुधन लिलावांवर बोली लावा आणि व्यवहारांचा मागोवा घ्या।"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.bid) content.bid = {};
    Object.assign(content.bid, newKeys[lang].bid);
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged bid translations into ${lang}.json`);
  }
});
