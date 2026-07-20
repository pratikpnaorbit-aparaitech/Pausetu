// merge_locales_polish.js
// Updates step header translations for Phase 4 UI polish.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    estimator: {
      steps: {
        header: "Question {{current}} of 7"
      }
    }
  },
  hi: {
    estimator: {
      steps: {
        header: "प्रश्न {{current}} का 7"
      }
    }
  },
  mr: {
    estimator: {
      steps: {
        header: "प्रश्न {{current}} पैकी ७"
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.estimator) content.estimator = {};
    if (!content.estimator.steps) content.estimator.steps = {};
    
    Object.assign(content.estimator.steps, newData[lang].estimator.steps);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged Polish translations into ${lang}.json`);
  }
});
