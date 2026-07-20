// merge_locales_tab_planner.js
// Merges localized bottom tab title key 'tabs.feedPlanner' into translation files.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    tabs: {
      feedPlanner: "Feed Planner"
    }
  },
  hi: {
    tabs: {
      feedPlanner: "आहार योजना"
    }
  },
  mr: {
    tabs: {
      feedPlanner: "आहार योजना"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.tabs) content.tabs = {};
    
    Object.assign(content.tabs, newData[lang].tabs);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged tabs.feedPlanner translations into ${lang}.json`);
  }
});
