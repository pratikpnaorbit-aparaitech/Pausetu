// merge_locales_ai_insights.js
// Script to merge dynamic AI selling insights translations for English, Hindi, and Marathi.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    estimator: {
      suggestions: {
        ai: {
          vaccination: "Complete vaccinations can increase the animal's value by 8%.",
          weight: "Better weight and body condition score can improve selling price.",
          verification: "Verified profiles and video uploads increase buyer trust and speed up sales.",
          season: "Monsoon/Winter festival season increases local market demand.",
          milk: "High milk production yield dramatically improves overall valuation."
        }
      }
    }
  },
  hi: {
    estimator: {
      suggestions: {
        ai: {
          vaccination: "पूर्ण टीकाकरण से पशु के मूल्य में 8% तक की वृद्धि हो सकती है।",
          weight: "बेहतर वजन और शारीरिक स्थिति से बिक्री मूल्य में सुधार हो सकता है।",
          verification: "सत्यापित प्रोफाइल और वीडियो अपलोड से खरीदार का भरोसा बढ़ता है और बिक्री तेज होती है।",
          season: "मानसून/सर्दियों के त्योहारी सीजन से स्थानीय बाजार की मांग बढ़ती है।",
          milk: "उच्च दूध उत्पादन क्षमता से समग्र मूल्यांकन में भारी सुधार होता है।"
        }
      }
    }
  },
  mr: {
    estimator: {
      suggestions: {
        ai: {
          vaccination: "पूर्ण लसीकरण केल्याने पशूचे मूल्य ८% पर्यंत वाढू शकते.",
          weight: "उत्कृष्ट वजन आणि शारीरिक स्थितीमुळे विक्रीच्या किंमतीत सुधारणा होऊ शकते.",
          verification: "सत्यापित प्रोफाइल आणि व्हिडिओ अपलोड केल्याने ग्राहकांचा विश्वास वाढतो आणि जलद विक्री होते.",
          season: "पावसाळा/हिवाळ्यातील सणांच्या काळात स्थानिक बाजारातील मागणी वाढते.",
          milk: "भरपूर दूध देण्याच्या क्षमतेमुळे पशूच्या एकूण बाजारभावात मोठी वाढ होते."
        }
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.estimator) content.estimator = {};
    if (!content.estimator.suggestions) content.estimator.suggestions = {};
    if (!content.estimator.suggestions.ai) content.estimator.suggestions.ai = {};
    
    Object.assign(content.estimator.suggestions.ai, newData[lang].estimator.suggestions.ai);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged AI insights translations into ${lang}.json`);
  }
});
