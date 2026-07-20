// merge_locales_filters.js
// Registers localization strings for sorting options, filter sheet fields and action buttons.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    buy: {
      newestFirst: "Newest First",
      oldestFirst: "Oldest First",
      lowestPrice: "Lowest Price",
      highestPrice: "Highest Price",
      nearest: "Nearest First",
      highestMilk: "Highest Milk Yield",
      bestDeal: "Best AI Deals",
      verifiedSellers: "Verified Sellers",
      premiumListings: "Premium Listings",
      recentlyUpdated: "Recently Updated",
      applyFilters: "Apply Filters",
      reset: "Reset",
      sortBy: "Sort By",
      filters: "Filters",
      noAnimalsFound: "No animals found matching your search.",
      viewDetails: "View Details"
    }
  },
  hi: {
    buy: {
      newestFirst: "नवीनतम पहले",
      oldestFirst: "पुराने पहले",
      lowestPrice: "न्यूनतम कीमत",
      highestPrice: "उच्चतम कीमत",
      nearest: "निकटतम पहले",
      highestMilk: "उच्चतम दूध उत्पादन",
      bestDeal: "सर्वश्रेष्ठ एआई डील",
      verifiedSellers: "सत्यापित विक्रेता",
      premiumListings: "प्रीमियम पशु",
      recentlyUpdated: "हाल ही में अपडेट किया गया",
      applyFilters: "फ़िल्टर लागू करें",
      reset: "रीसेट",
      sortBy: "क्रमबद्ध करें",
      filters: "फ़िल्टर",
      noAnimalsFound: "आपके खोज के अनुकूल कोई पशु नहीं मिला।",
      viewDetails: "विवरण देखें"
    }
  },
  mr: {
    buy: {
      newestFirst: "नवीनतम आधी",
      oldestFirst: "जुने आधी",
      lowestPrice: "कमी किंमत आधी",
      highestPrice: "जास्त किंमत आधी",
      nearest: "जवळपासचे पशू आधी",
      highestMilk: "जास्त दूध उत्पादन",
      bestDeal: "उत्तम एआई सौदे",
      verifiedSellers: "सत्यापित विक्रेते",
      premiumListings: "प्रीमियम पशू",
      recentlyUpdated: "नुकतेच अपडेट केलेले",
      applyFilters: "फिल्टर लागू करा",
      reset: "रीसेट",
      sortBy: "यानुसार लावा",
      filters: "फिल्टर",
      noAnimalsFound: "तुमच्या शोधानुसार पशू आढळला नाही.",
      viewDetails: "तपशील पहा"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.buy) content.buy = {};
    
    Object.assign(content.buy, newData[lang].buy);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged advanced filter localizations into ${lang}.json`);
  }
});
