// merge_locales_planner_tips.js
// Append custom advisory tips and warnings for Feed Planner.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    feedPlanner: {
      tips: {
        cow: {
          jersey: "Jersey cows need good fiber. Keep a 60:40 ratio of green fodder to dry fodder.",
          hf: "HF cows are highly sensitive to heat stress. Ensure cool, shaded housing and ventilation.",
          gir: "Gir is highly resilient. Indigenous breeds benefit from natural grazing plus basic concentrate.",
          sahiwal: "Sahiwal cows have high fat yield. Feed balanced cotton seed cake to maintain milk quality.",
          desi: "Desi cows require low maintenance. Feed dry fodder mixed with mustard/cotton oil cake.",
          other: "Ensure basic balanced feed consisting of homegrown fodder and feed supplement."
        },
        buffalo: {
          murrah: "Murrah buffaloes need high energy. Feed extra sirka and cotton seed cake for fat yield.",
          mehsana: "Mehsana buffaloes are good milkers. Keep concentrate levels high during lactation peak.",
          surti: "Surti buffaloes are compact. Manage feed carefully to avoid obesity and foot problems.",
          pandharpuri: "Pandharpuri breed is highly adapted to dry climates. Keep hydration levels high.",
          local: "Local buffaloes thrive on natural grasses. Add 30g daily mineral mixture.",
          other: "Keep clean drinking water and green grasses available continuously."
        },
        goal: {
          inc_milk: "Increase concentrate feed gradually over 10 days to avoid rumen acidosis.",
          gain_wt: "Feed energy-dense bypass fats or grains to support healthy muscle growth.",
          maintenance: "Maintenance feeding requires moderate fiber. Minimize expensive concentrates.",
          preg_support: "Provide additional calcium and phosphorus in the last trimester of pregnancy."
        },
        water: "Clean drinking water should be available 24/7. Dairy cattle drink up to 80-100L daily."
      },
      warnings: {
        pregnant: "Avoid feeding moldy straw or rotten silage to prevent pregnancy complications.",
        no_green: "Lack of green fodder causes Vitamin A deficiency. Feed mineral mixtures regularly.",
        high_milk: "High milk yielders are at risk of milk fever. Ensure calcium supplement administration."
      }
    }
  },
  hi: {
    feedPlanner: {
      tips: {
        cow: {
          jersey: "जर्सी गायों को अच्छे फाइबर की आवश्यकता होती है। हरा और सूखा चारा 60:40 अनुपात में रखें।",
          hf: "एचएफ गायें गर्मी के प्रति संवेदनशील होती हैं। ठंडी और हवादार जगह सुनिश्चित करें।",
          gir: "गीर गायें मजबूत होती हैं। प्राकृतिक चराई और बुनियादी पशु आहार का मिश्रण दें।",
          sahiwal: "साहीवाल में वसा की मात्रा अधिक होती है। दूध की गुणवत्ता बनाए रखने के लिए संतुलित कपास खल दें।",
          desi: "देशी गायों को कम रखरखाव की आवश्यकता होती है। सूखे चारे में सरसों/सरकी तेल खल मिलाएं।",
          other: "सुनिश्चित करें कि बुनियादी संतुलित आहार में घरेलू चारा और खनिज शामिल हो।"
        },
        buffalo: {
          murrah: "मुर्रा भैंसों को अधिक ऊर्जा की आवश्यकता होती है। वसा प्रतिशत बढ़ाने के लिए अतिरिक्त सरकी खल दें।",
          mehsana: "मेहसाणा भैंसें अच्छी दुधारू होती हैं। चरम काल में आहार का स्तर ऊंचा रखें।",
          surti: "सुरती भैंसें मध्यम आकार की होती हैं। मोटापा रोकने के लिए संतुलित आहार दें।",
          pandharpuri: "पंढरपुरी भैंस सूखे मौसम के अनुकूल होती है। पर्याप्त पानी देना सुनिश्चित करें।",
          local: "स्थानीय भैंसें प्राकृतिक घास पर फलती-फूलती हैं। 30 ग्राम दैनिक खनिज मिश्रण जोड़ें।",
          other: "साफ पीने का पानी और हरी घास लगातार उपलब्ध रखें।"
        },
        goal: {
          inc_milk: "अपच से बचने के लिए अगले 10 दिनों में धीरे-धीरे पशु आहार की मात्रा बढ़ाएं।",
          gain_wt: "स्वस्थ मांसपेशियों के विकास के लिए ऊर्जा से भरपूर अनाज या वसा दें।",
          maintenance: "शरीर रखरखाव के लिए सूखे चारे की आवश्यकता होती है। महंगे पशु आहार की मात्रा कम रखें।",
          preg_support: "गर्भावस्था के अंतिम 3 महीनों में अतिरिक्त कैल्शियम और फास्फोरस दें।"
        },
        water: "साफ पीने का पानी 24 घंटे उपलब्ध होना चाहिए। दुधारू पशु प्रतिदिन 80-100 लीटर पानी पीते हैं।"
      },
      warnings: {
        pregnant: "गर्भावस्था की जटिलताओं से बचने के लिए सड़ा हुआ या पुराना चारा न खिलाएं।",
        no_green: "हरे चारे की कमी से विटामिन ए की कमी हो सकती है। नियमित खनिज मिश्रण दें।",
        high_milk: "अधिक दूध देने वाले पशुओं में मिल्क फीवर का खतरा होता है। कैल्शियम सप्लीमेंट दें।"
      }
    }
  },
  mr: {
    feedPlanner: {
      tips: {
        cow: {
          jersey: "जर्सी गाईंना चांगल्या फायबरची गरज असते. ओला आणि सुका चारा ६०:४० प्रमाणात द्यावा.",
          hf: "एचएफ गाईंना उष्णतेचा त्रास लवकर होतो. गोठ्यात थंड हवा आणि वायुविजन असावे.",
          gir: "गीर गाई अत्यंत काटक असतात. मोकळ्या चरण्यासोबतच मूलभूत पशूखाद्य द्यावे.",
          sahiwal: "साहिवाल गाईच्या दुधात जास्त फॅट असते. दुधाची गुणवत्ता टिकवण्यासाठी संतुलित सरकी पेंड द्या.",
          desi: "गावरान गाईंना कमी खर्चात सांभाळता येते. सुक्या चार्‍यामध्ये तेल पेंड मिक्स करा.",
          other: "घरगुती चारा आणि खनिज मिश्रणाचा वापर करून संतुलित पशूखाद्य द्या."
        },
        buffalo: {
          murrah: "मुऱ्हा म्हशींना जास्त ऊर्जेची गरज असते. फॅट वाढवण्यासाठी पशूखाद्यासोबत सरकी पेंड द्या.",
          mehsana: "मेहसाणा म्हशी भरपूर दूध देतात. विल्यानंतर सुरुवातीच्या काळात पशूखाद्याचे प्रमाण चांगले ठेवा.",
          surti: "सुरती म्हशी आकाराने लहान असतात. अतिरिक्त चरबी किंवा लठ्ठपणा रोखण्यासाठी संतुलित आहार द्या.",
          pandharpuri: "पंढरपुरी म्हैस कोरड्या हवामानासाठी अत्यंत अनुकूल आहे. पाणी पिण्याचे प्रमाण चांगले ठेवा.",
          local: "गावरान म्हशी नैसर्गिक गवतावर चांगल्या दूध देतात. त्यांना रोज ३० ग्रॅम मिनरल मिक्स्चर द्या.",
          other: "स्वच्छ पिण्याचे पाणी आणि हिरवा चारा चोवीस तास उपलब्ध ठेवावा."
        },
        goal: {
          inc_milk: "ॲसिडोसिस टाळण्यासाठी पशूखाद्याचे प्रमाण १० दिवसांत हळूहळू वाढवावे.",
          gain_wt: "चांगल्या स्नायूंच्या वाढीसाठी बायपास फॅट किंवा धान्याचा भरडा द्यावा.",
          maintenance: "तंदुरुस्ती राखण्यासाठी सुक्या चार्‍याचे प्रमाण जास्त ठेवा. महागडे पशूखाद्य कमी करा.",
          preg_support: "गाभण काळातील शेवटच्या ३ महिन्यांत हाडांच्या पोषणासाठी कॅल्शियम आणि फॉस्फरस द्या."
        },
        water: "स्वच्छ पिण्याचे पाणी २४ तास उपलब्ध ठेवावे. दुधाळ जनावरे दिवसाला ८० ते १०० लीटर पाणी पितात."
      },
      warnings: {
        pregnant: "गाभण जनावरांना बुरशी आलेला किंवा सडलेला चारा दिल्यास गर्भपात होऊ शकतो.",
        no_green: "हिरव्या चार्‍याच्या कमतरतेमुळे व्हिटॅमिन 'अ' ची कमतरता होते. मिनरल मिक्स्चर नियमित द्या.",
        high_milk: "जास्त दूध देणाऱ्या जनावरांना कॅल्शियमच्या कमतरतेमुळे मिल्क फीवर (दुग्धज्वर) होऊ शकतो."
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.feedPlanner) content.feedPlanner = {};
    if (!content.feedPlanner.tips) content.feedPlanner.tips = {};
    if (!content.feedPlanner.warnings) content.feedPlanner.warnings = {};
    
    Object.assign(content.feedPlanner.tips, newData[lang].feedPlanner.tips);
    Object.assign(content.feedPlanner.warnings, newData[lang].feedPlanner.warnings);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged Feed Planner Advisory tips into ${lang}.json`);
  }
});
