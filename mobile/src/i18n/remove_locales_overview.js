// remove_locales_overview.js
// Removes monthlyOverview, juneSummary, views, enquiries, soldListing from i18n locales.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (content.sell) {
      delete content.sell.monthlyOverview;
      delete content.sell.juneSummary;
      delete content.sell.revenue;
      delete content.sell.views;
      delete content.sell.enquiries;
      delete content.sell.soldListing;
      fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
      console.log(`Cleaned up Monthly Overview translation keys from ${lang}.json`);
    }
  }
});
