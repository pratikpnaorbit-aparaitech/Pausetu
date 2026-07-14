// merge_locales_premium_MP.js
// Adds localized content for Phase 3 Premium Market Price AI Unlock Screen.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    estimator: {
      premium: {
        title: "AI Market Price Assistant",
        subtitle: "Unlock lifetime access to our advanced livestock valuation engine",
        unlockBtn: "Unlock for ₹1",
        benefitValuationTitle: "Accurate Valuation",
        benefitValuationDesc: "Uses 10+ advanced animal physiological and environmental factors.",
        benefitInsightsTitle: "AI Insights",
        benefitInsightsDesc: "Dynamic rules generate targeted actions to maximize selling price.",
        benefitDemandTitle: "Market Demand",
        benefitDemandDesc: "Analyzes district-specific trends and seasonality index.",
        benefitRecommendationTitle: "Selling Recommendation",
        benefitRecommendationDesc: "Actionable tips regarding health, verification, and timing."
      }
    }
  },
  hi: {
    estimator: {
      premium: {
        title: "एआई बाज़ार मूल्य सहायक",
        subtitle: "हमारे उन्नत पशुधन मूल्यांकन इंजन तक आजीवन पहुंच अनलॉक करें",
        unlockBtn: "₹1 के लिए अनलॉक करें",
        benefitValuationTitle: "सटीक मूल्यांकन",
        benefitValuationDesc: "10+ उन्नत पशु शारीरिक और पर्यावरणीय कारकों का उपयोग करता है।",
        benefitInsightsTitle: "एआई अंतर्दृष्टि",
        benefitInsightsDesc: "गतिशील नियम बिक्री मूल्य को अधिकतम करने के लिए लक्षित क्रियाएं उत्पन्न करते हैं।",
        benefitDemandTitle: "बाज़ार की मांग",
        benefitDemandDesc: "जिला-विशिष्ट प्रवृत्तियों और मौसमी सूचकांक का विश्लेषण करता है।",
        benefitRecommendationTitle: "बिक्री की सिफारिश",
        benefitRecommendationDesc: "स्वास्थ्य, सत्यापन और समय के संबंध में कार्रवाई योग्य सुझाव।"
      }
    }
  },
  mr: {
    estimator: {
      premium: {
        title: "एआय बाजारभाव सहाय्यक",
        subtitle: "पशूच्या अचूक बाजारभावाचे मूल्यांकन पाहण्यासाठी प्रवेश मिळवा",
        unlockBtn: "₹१ मध्ये अनलॉक करा",
        benefitValuationTitle: "अचूक मूल्यांकन",
        benefitValuationDesc: "पशूच्या शारीरिक आणि वातावरणीय घटकांचा सखोल अभ्यास करून मिळवा अचूक दर.",
        benefitInsightsTitle: "एआय मार्गदर्शन",
        benefitInsightsDesc: "विक्रीची किंमत जास्तीत जास्त वाढवण्यासाठी उपयुक्त सल्ला मिळवा.",
        benefitDemandTitle: "बाजारपेठ मागणी",
        benefitDemandDesc: "जिल्हावार मागणी आणि सणांनुसार होणारे बदल तपासा.",
        benefitRecommendationTitle: "बिक्री शिफारस",
        benefitRecommendationDesc: "आरोग्य, लसीकरण आणि योग्य वेळेची अचूक माहिती."
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.estimator) content.estimator = {};
    if (!content.estimator.premium) content.estimator.premium = {};
    
    Object.assign(content.estimator.premium, newData[lang].estimator.premium);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged Phase 3 premium translations into ${lang}.json`);
  }
});
