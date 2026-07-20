// merge_locales_chat_polish.js
// Script to merge Phase 4 chat assistant localization keys into en.json, hi.json, and mr.json.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    common: {
      today: "TODAY",
      online: "Online",
      loading: "Typing..."
    },
    estimator: {
      chat: {
        restartTitle: "Restart Market Price Assistant?",
        restartMessage: "All answers, chat history, summary, valuation and progress will be cleared.",
        completedNotice: "Valuation completed. Tap Restart to create a new valuation.",
        analyzing: "Analyzing livestock market values...",
        summaryCard: "Valuation Input Summary"
      }
    }
  },
  hi: {
    common: {
      today: "आज",
      online: "ऑनलाइन",
      loading: "टाइपिंग..."
    },
    estimator: {
      chat: {
        restartTitle: "बाज़ार मूल्य सहायक रीस्टार्ट करें?",
        restartMessage: "सभी उत्तर, चैट इतिहास, सारांश, मूल्यांकन और प्रगति साफ़ हो जाएगी।",
        completedNotice: "मूल्यांकन पूरा हुआ। नया मूल्यांकन बनाने के लिए रीस्टार्ट पर टैप करें।",
        analyzing: "पशुधन बाजार मूल्यों का विश्लेषण किया जा रहा है...",
        summaryCard: "मूल्यांकन इनपुट सारांश"
      }
    }
  },
  mr: {
    common: {
      today: "आज",
      online: "ऑनलाइन",
      loading: "टायपिंग..."
    },
    estimator: {
      chat: {
        restartTitle: "बाजारभाव सहाय्यक रीस्टार्ट करायचा?",
        restartMessage: "सर्व उत्तरे, चॅट इतिहास, सारांश, मूल्यांकन आणि प्रगती मिटवली जाईल.",
        completedNotice: "मूल्यांकन पूर्ण झाले. नवीन मूल्यांकन करण्यासाठी रीस्टार्ट दाबा.",
        analyzing: "पशुधनाच्या बाजारभावाचे विश्लेषण सुरू आहे...",
        summaryCard: "मूल्यांकन इनपुट सारांश"
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.common) content.common = {};
    if (!content.estimator) content.estimator = {};
    if (!content.estimator.chat) content.estimator.chat = {};
    
    Object.assign(content.common, newData[lang].common);
    Object.assign(content.estimator.chat, newData[lang].estimator.chat);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged Phase 4 chat translations into ${lang}.json`);
  }
});
