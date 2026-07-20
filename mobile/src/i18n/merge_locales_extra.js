const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newKeys = {
  en: {
    settings: {
      otpAuthInfo: "PashuSetu uses OTP-based authentication. To reset your login, we will send a one-time password to your registered contact.",
      didNotFindAnswer: "Didn't find your answer? Email us at",
      aboutBuild: "Build",
      aboutEmpower: "PashuSetu empowers rural farmers across India to buy, sell, and connect through a trusted livestock marketplace."
    }
  },
  hi: {
    settings: {
      otpAuthInfo: "PashuSetu ओटीपी-आधारित प्रमाणीकरण का उपयोग करता है। अपने लॉगिन को रीसेट करने के लिए, हम आपके पंजीकृत संपर्क पर एक बार का पासवर्ड भेजेंगे।",
      didNotFindAnswer: "अपना उत्तर नहीं मिला? हमें ईमेल करें",
      aboutBuild: "बिल्ड",
      aboutEmpower: "PashuSetu भारत भर के ग्रामीण किसानों को एक विश्वसनीय पशुधन बाज़ार के माध्यम से खरीदने, बेचने और जुड़ने के लिए सशक्त बनाता है।"
    }
  },
  mr: {
    settings: {
      otpAuthInfo: "PashuSetu OTP-आधारित प्रमाणीकरण वापरते. तुमचे लॉगिन रीसेट करण्यासाठी, आम्ही तुमच्या नोंदणीकृत संपर्कावर एक-वेळचा पासवर्ड पाठवू.",
      didNotFindAnswer: "तुमचे उत्तर सापडले नाही? आम्हाला ईमेल करा",
      aboutBuild: "बिल्ड",
      aboutEmpower: "PashuSetu भारतातील ग्रामीण शेतकऱ्यांना एका विश्वसनीय पशुधन बाजारपेठेच्या माध्यमातून खरेदी, विक्री आणि जोडण्यासाठी सक्षम करते."
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.settings) content.settings = {};
    Object.assign(content.settings, newKeys[lang].settings);
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged extra settings translations into ${lang}.json`);
  }
});
