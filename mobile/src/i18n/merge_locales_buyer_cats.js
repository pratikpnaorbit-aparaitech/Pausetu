// merge_locales_buyer_cats.js
// Adds localized categories and UI section titles for Buyer Tab.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    buy: {
      camel: "Camel 🐫",
      pig: "Pig 🐖",
      chicken: "Chicken 🐓",
      latestListings: "Latest Listings",
      nearbyAnimals: "Nearby Animals",
      featuredAnimals: "Featured Animals",
      aiRecommended: "AI Recommended",
      premiumListings: "Premium Listings",
      verifiedSellers: "Verified Sellers",
      recentlyViewed: "Recently Viewed",
      trendingAnimals: "Trending Animals",
      bestDeals: "Best Deals",
      recommendedForYou: "Recommended For You",
      searchAnimals: "Search Animals...",
      aiSmartSearch: "AI Smart Search",
      voiceSearch: "Voice Search",
      recentSearches: "Recent Searches",
      trendingSearches: "Trending Searches",
      suggestedBreeds: "Suggested Breeds",
      checkAiPrice: "Check AI Price →",
      knowAiValue: "Know Exact AI Market Value",
      aiAnalyzes: "AI analyzes breed, age, milk yield, weight, health to calculate dynamic value.",
      goodDeal: "GOOD DEAL",
      belowMarket: "Below Market",
      negotiable: "Negotiable",
      urgentSale: "Urgent Sale",
      pregnantText: "Pregnant",
      lactation: "Lactation",
      calves: "Calves",
      horns: "Horns",
      earTag: "Ear Tag",
      memberSince: "Member Since",
      responseRate: "Response Rate",
      animalsSold: "Animals Sold",
      distanceKm: "{{distance}} km away",
      callSeller: "Call Seller",
      whatsapp: "WhatsApp",
      directions: "Directions",
      save: "Save",
      share: "Share",
      report: "Report",
      activeListings: "Available Animals"
    }
  },
  hi: {
    buy: {
      camel: "ऊँट 🐫",
      pig: "सूअर 🐖",
      chicken: "मुर्गी 🐓",
      latestListings: "नवीनतम पशु",
      nearbyAnimals: "आस-पास के पशु",
      featuredAnimals: "चुनिंदा पशु",
      aiRecommended: "एआई अनुशंसित",
      premiumListings: "खास पशु",
      verifiedSellers: "भरोसेमंद विक्रेता",
      recentlyViewed: "हाल ही में देखे गए",
      trendingAnimals: "लोकप्रिय पशु",
      bestDeals: "सर्वोत्तम सौदे",
      recommendedForYou: "आपके लिए अनुशंसित",
      searchAnimals: "पशु खोजें...",
      aiSmartSearch: "एआई स्मार्ट खोज",
      voiceSearch: "आवाज खोज",
      recentSearches: "हाल की खोजें",
      trendingSearches: "प्रचलित खोजें",
      suggestedBreeds: "सुझाई गई नस्लें",
      checkAiPrice: "एआई कीमत जांचें →",
      knowAiValue: "सटीक एआई बाजार मूल्य जानें",
      aiAnalyzes: "एआई गतिशील मूल्य की गणना करने के लिए नस्ल, उम्र, दूध, वजन, स्वास्थ्य का विश्लेषण करता है।",
      goodDeal: "अच्छा सौदा",
      belowMarket: "बाजार से कम",
      negotiable: "परक्राम्य (मोलभाव)",
      urgentSale: "अत्यावश्यक बिक्री",
      pregnantText: "गर्भवती",
      lactation: "लैक्टेशन",
      calves: "बछड़े",
      horns: "सींग",
      earTag: "कान का टैग",
      memberSince: "सदस्यता वर्ष",
      responseRate: "प्रतिक्रिया दर",
      animalsSold: "पशु बेचे गए",
      distanceKm: "{{distance}} किमी दूर",
      callSeller: "कॉल करें",
      whatsapp: "व्हाट्सएप",
      directions: "दिशा-निर्देश",
      save: "सुरक्षित करें",
      share: "साझा करें",
      report: "रिपोर्ट करें",
      activeListings: "उपलब्ध पशु"
    }
  },
  mr: {
    buy: {
      camel: "उंट 🐫",
      pig: "डुक्कर 🐖",
      chicken: "कोंबडी 🐓",
      latestListings: "नवीनतम पशू",
      nearbyAnimals: "जवळपासचे पशू",
      featuredAnimals: "निवडक जनावरे",
      aiRecommended: "एआई शिफारस",
      premiumListings: "खास पशू",
      verifiedSellers: "खात्रीशीर विक्रेते",
      recentlyViewed: "नुकतेच पाहिलेले पशू",
      trendingAnimals: "लोकप्रिय पशू",
      bestDeals: "सर्वोत्तम सौदे",
      recommendedForYou: "तुमच्यासाठी शिफारस केलेले",
      searchAnimals: "पशू शोधा...",
      aiSmartSearch: "एआय स्मार्ट शोध",
      voiceSearch: "व्हॉइस शोध",
      recentSearches: "अलीकडील शोध",
      trendingSearches: "चालू शोध",
      suggestedBreeds: "शिफारस केलेल्या जाती",
      checkAiPrice: "एआय किंमत तपासा →",
      knowAiValue: "अचूक एआय बाजार भाव जाणून घ्या",
      aiAnalyzes: "एआय अचूक मूल्य काढण्यासाठी जात, वय, दूध उत्पादन, वजन, आरोग्य यांचे विश्लेषण करते.",
      goodDeal: "उत्तम सौदा",
      belowMarket: "बाजारभावापेक्षा कमी",
      negotiable: "दर कमी होईल",
      urgentSale: "तातडीची विक्री",
      pregnantText: "गाभण",
      lactation: "वेताची संख्या",
      calves: "वासरे",
      horns: "शिंगे",
      earTag: "कानातील टॅग क्रमांक",
      memberSince: "सदस्यता",
      responseRate: "उत्तर देण्याचा दर",
      animalsSold: "विक्री केलेले पशू",
      distanceKm: "{{distance}} किमी अंतरावर",
      callSeller: "कॉल करा",
      whatsapp: "व्हाट्सॲप",
      directions: "दिशा दाखवा",
      save: "सेव्ह करा",
      share: "शेअर करा",
      report: "तक्रार करा",
      activeListings: "उपलब्ध पशू"
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
    console.log(`Merged Buyer redesigned categories and sections into ${lang}.json`);
  }
});
