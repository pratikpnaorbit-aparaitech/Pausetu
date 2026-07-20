const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newKeys = {
  en: {
    settings: {
      faq1_q: "How do I list my animal for sale?",
      faq1_a: "Go to the Post tab, fill in all required details including at least 5 photos and one video, and submit. Your listing will go live after admin approval.",
      faq2_q: "How long does approval take?",
      faq2_a: "Listings are typically approved within 24 hours by our moderation team. You will receive a notification once approved.",
      faq3_q: "Is my phone number visible to buyers?",
      faq3_a: "Your phone number is only shared when a buyer taps Call or WhatsApp on your listing. It is not displayed publicly.",
      faq4_q: "How do I contact a seller?",
      faq4_a: "Open any animal listing and tap Call, WhatsApp, or Chat in the seller section.",
      faq5_q: "Can I edit my listing after posting?",
      faq5_a: "Yes. Go to My Listings, select the listing, and tap Edit. Note: editing resets approval status.",
      faq6_q: "How do I delete my account?",
      faq6_a: "Contact us at support@pashusetu.com with your registered email and we will process the deletion within 7 business days.",

      policy1_h: "1. Information We Collect",
      policy1_b: "We collect your name, phone number, email address, and location (village, taluka, district, state) to provide our livestock marketplace services. Photos and videos you upload are stored on our secure servers.",
      policy2_h: "2. How We Use Your Information",
      policy2_b: "Your information is used to show your listings to potential buyers, verify your identity, send OTP-based login codes, and improve our services. We do not sell your personal data to third parties.",
      policy3_h: "3. Data Storage & Security",
      policy3_b: "All data is stored on encrypted servers hosted in India. JWT tokens are stored securely using device Keychain (iOS) or KeyStore (Android). We follow industry-standard security practices.",
      policy4_h: "4. Location Data",
      policy4_b: "Location information (village, district, state) is used to display your listing to nearby buyers. We do not collect GPS coordinates without your explicit permission.",
      policy5_h: "5. Media Uploads",
      policy5_b: "Photos and videos of animals you upload become part of your public listing. Ensure you have the right to share any media you upload. Uploads are stored securely and deleted when you remove a listing.",
      policy6_h: "6. Your Rights",
      policy6_b: "You may request deletion of your account and all associated data by emailing support@pashusetu.com. Data deletion is processed within 7 business days.",
      policy7_h: "7. Contact",
      policy7_b: "For privacy concerns: support@pashusetu.com",

      terms1_h: "1. Acceptance",
      terms1_b: "By using PashuSetu, you agree to these Terms. If you do not agree, please do not use the application.",
      terms2_h: "2. Eligibility",
      terms2_b: "You must be at least 18 years old to use PashuSetu. By registering, you confirm you are legally eligible to enter into contracts under Indian law.",
      terms3_h: "3. Listing Rules",
      terms3_b: "Listings must be genuine and accurate. Posting animals you do not own, using stock photos, or misrepresenting an animal's health or age is strictly prohibited and will result in immediate account suspension.",
      terms4_h: "4. Mandatory Media",
      terms4_b: "Each listing requires a minimum of 5 photographs and one live video of the actual animal being sold. This is enforced to build buyer trust.",
      terms5_h: "5. Prohibited Content",
      terms5_b: "Illegal animals, protected species, or any listing that violates Indian wildlife protection laws are strictly prohibited.",
      terms6_h: "6. Transactions",
      terms6_b: "PashuSetu is a marketplace platform. We facilitate connections between buyers and sellers but are not a party to any transaction. All deals are between buyers and sellers directly.",
      terms7_h: "7. Liability",
      terms7_b: "PashuSetu is not liable for the quality, health, or accuracy of any animal listed. We recommend buyers verify animals in person before completing any transaction.",
      terms8_h: "8. Termination",
      terms8_b: "We reserve the right to suspend or terminate accounts that violate these terms without prior notice.",
      terms9_h: "9. Governing Law",
      terms9_b: "These terms are governed by the laws of India. Disputes shall be subject to the jurisdiction of courts in Pune, Maharashtra.",
      terms10_h: "10. Contact",
      terms10_b: "For legal queries: support@pashusetu.com",

      fontSize_small: "Small",
      fontSize_medium: "Medium",
      fontSize_large: "Large"
    }
  },
  hi: {
    settings: {
      faq1_q: "अपना पशु बेचने के लिए कैसे सूचीबद्ध करूं?",
      faq1_a: "पोस्ट टैब पर जाएं, कम से कम 5 फोटो और एक वीडियो सहित सभी आवश्यक विवरण भरें और सबमिट करें। व्यवस्थापक की मंजूरी के बाद आपकी लिस्टिंग लाइव हो जाएगी।",
      faq2_q: "मंजूरी मिलने में कितना समय लगता है?",
      faq2_a: "हमारी मॉडरेशन टीम द्वारा लिस्टिंग को आम तौर पर 24 घंटे के भीतर मंजूरी दे दी जाती है। स्वीकृत होने पर आपको एक सूचना प्राप्त होगी।",
      faq3_q: "क्या मेरा फोन नंबर खरीदारों को दिखाई देता है?",
      faq3_a: "आपका फोन नंबर केवल तभी साझा किया जाता है जब कोई खरीदार आपकी लिस्टिंग पर कॉल या व्हाट्सएप टैप करता है। यह सार्वजनिक रूप से प्रदर्शित नहीं होता है।",
      faq4_q: "मैं किसी विक्रेता से कैसे संपर्क करूं?",
      faq4_a: "किसी भी पशु की लिस्टिंग खोलें और विक्रेता अनुभाग में कॉल, व्हाट्सएप या चैट पर टैप करें।",
      faq5_q: "क्या मैं पोस्ट करने के बाद अपनी लिस्टिंग संपादित कर सकता हूँ?",
      faq5_a: "हाँ। मेरी लिस्टिंग पर जाएं, लिस्टिंग चुनें और संपादित करें पर टैप करें। नोट: संपादन करने पर अनुमोदन स्थिति रीसेट हो जाती है।",
      faq6_q: "मैं अपना खाता कैसे हटाऊं?",
      faq6_a: "अपने पंजीकृत ईमेल के साथ support@pashusetu.com पर हमसे संपर्क करें और हम 7 कार्य दिवसों के भीतर खाता हटाने की प्रक्रिया पूरी कर देंगे।",

      policy1_h: "1. सूचना जो हम एकत्र करते हैं",
      policy1_b: "हम हमारे पशुधन बाज़ार सेवाएं प्रदान करने के लिए आपका नाम, फ़ोन नंबर, ईमेल पता और स्थान (गाँव, तालुका, जिला, राज्य) एकत्र करते हैं। आपके द्वारा अपलोड की गई तस्वीरें और वीडियो हमारे सुरक्षित सर्वर पर संग्रहीत किए जाते हैं।",
      policy2_h: "2. हम आपकी जानकारी का उपयोग कैसे करते हैं",
      policy2_b: "आपकी जानकारी का उपयोग संभावित खरीदारों को आपकी लिस्टिंग दिखाने, आपकी पहचान सत्यापित करने, ओटीपी-आधारित लॉगिन कोड भेजने और हमारी सेवाओं को बेहतर बनाने के लिए किया जाता है। हम आपका व्यक्तिगत डेटा तीसरे पक्ष को नहीं बेचते हैं।",
      policy3_h: "3. डेटा भंडारण और सुरक्षा",
      policy3_b: "सभी डेटा भारत में होस्ट किए गए एन्क्रिप्टेड सर्वरों पर संग्रहीत हैं। JWT टोकन डिवाइस कीचेन (iOS) या कीस्टोर (Android) का उपयोग करके सुरक्षित रूप से संग्रहीत किए जाते हैं। हम उद्योग-मानक सुरक्षा प्रथाओं का पालन करते हैं।",
      policy4_h: "4. स्थान डेटा",
      policy4_b: "स्थान की जानकारी (गाँव, जिला, राज्य) का उपयोग आपके आस-पास के खरीदारों को आपकी लिस्टिंग दिखाने के लिए किया जाता है। हम आपकी स्पष्ट अनुमति के बिना जीपीएस निर्देशांक एकत्र नहीं करते हैं।",
      policy5_h: "5. मीडिया अपलोड",
      policy5_b: "आपके द्वारा अपलोड की गई पशुओं की तस्वीरें और वीडियो आपकी सार्वजनिक लिस्टिंग का हिस्सा बन जाते हैं। सुनिश्चित करें कि आपके पास आपके द्वारा अपलोड किए गए किसी भी मीडिया को साझा करने का अधिकार है। अपलोड सुरक्षित रूप से संग्रहीत किए जाते हैं और जब आप लिस्टिंग हटाते हैं तो हटा दिए जाते हैं।",
      policy6_h: "6. आपके अधिकार",
      policy6_b: "आप support@pashusetu.com पर ईमेल करके अपने खाते और सभी संबंधित डेटा को हटाने का अनुरोध कर सकते हैं। डेटा हटाना 7 कार्य दिवसों के भीतर संसाधित किया जाता है।",
      policy7_h: "7. संपर्क करें",
      policy7_b: "गोपनीयता संबंधी चिंताओं के लिए: support@pashusetu.com",

      terms1_h: "1. स्वीकृति",
      terms1_b: "PashuSetu का उपयोग करके, आप इन शर्तों से सहमत होते हैं। यदि आप सहमत नहीं हैं, तो कृपया एप्लिकेशन का उपयोग न करें।",
      terms2_h: "2. पात्रता",
      terms2_b: "PashuSetu का उपयोग करने के लिए आपकी आयु कम से कम 18 वर्ष होनी चाहिए। पंजीकरण करके, आप पुष्टि करते हैं कि आप भारतीय कानून के तहत अनुबंध करने के लिए कानूनी रूप से पात्र हैं।",
      terms3_h: "3. लिस्टिंग नियम",
      terms3_b: "लिस्टिंग वास्तविक और सटीक होनी चाहिए। जिन जानवरों के आप मालिक नहीं हैं उन्हें पोस्ट करना, स्टॉक फ़ोटो का उपयोग करना, या किसी जानवर के स्वास्थ्य या आयु को गलत तरीके से प्रस्तुत करना सख्त वर्जित है और इसके परिणामस्वरूप खाता तुरंत निलंबित कर दिया जाएगा।",
      terms4_h: "4. अनिवार्य मीडिया",
      terms4_b: "प्रत्येक लिस्टिंग के लिए बेचे जा रहे वास्तविक जानवर की न्यूनतम 5 तस्वीरें और एक लाइव वीडियो की आवश्यकता होती है। खरीदार का विश्वास बनाने के लिए इसे लागू किया गया है।",
      terms5_h: "5. निषिद्ध सामग्री",
      terms5_b: "अवैध जानवर, संरक्षित प्रजातियाँ, या कोई भी लिस्टिंग जो भारतीय वन्यजीव संरक्षण कानूनों का उल्लंघन करती है, सख्त वर्जित है।",
      terms6_h: "6. लेनदेन",
      terms6_b: "PashuSetu एक बाज़ार मंच है। हम खरीदारों और विक्रेताओं के बीच संपर्क की सुविधा प्रदान करते हैं लेकिन किसी भी लेनदेन के पक्षकार नहीं हैं। सभी सौदे सीधे खरीदारों और विक्रेताओं के बीच होते हैं।",
      terms7_h: "7. दायित्व",
      terms7_b: "PashuSetu सूचीबद्ध किसी भी जानवर की गुणवत्ता, स्वास्थ्य या सटीकता के लिए उत्तरदायी नहीं है। हम अनुशंसा करते हैं कि खरीदार किसी भी लेनदेन को पूरा करने से पहले जानवरों की व्यक्तिगत रूप से पुष्टि करें।",
      terms8_h: "8. समाप्ति",
      terms8_b: "हम पूर्व सूचना के बिना इन शर्तों का उल्लंघन करने वाले खातों को निलंबित या समाप्त करने का अधिकार सुरक्षित रखते हैं।",
      terms9_h: "9. शासी कानून",
      terms9_b: "ये शर्तें भारत के कानूनों द्वारा शासित हैं। विवाद पुणे, महाराष्ट्र की अदालतों के अधिकार क्षेत्र के अधीन होंगे।",
      terms10_h: "10. संपर्क करें",
      terms10_b: "कानूनी प्रश्नों के लिए: support@pashusetu.com",
      fontSize_small: "छोटा",
      fontSize_medium: "मध्यम",
      fontSize_large: "बड़ा"
    }
  },
  mr: {
    settings: {
      faq1_q: "माझा प्राणी विक्रीसाठी कसा नोंदवू?",
      faq1_a: "पोस्ट टॅबवर जा, किमान ५ फोटो आणि एका व्हिडिओसह सर्व आवश्यक तपशील भरा आणि सबमिट करा. प्रशासकाच्या मंजुरीनंतर तुमची यादी थेट होईल.",
      faq2_q: "मंजुरी मिळण्यास किती वेळ लागतो?",
      faq2_a: "आमच्या नियंत्रण कार्यसंघाद्वारे याद्या सहसा २४ तासांच्या आत मंजूर केल्या जातात. मंजूर झाल्यावर तुम्हाला सूचना मिळेल.",
      faq3_q: "माझा फोन नंबर खरेदीदारांना दिसतो का?",
      faq3_a: "तुमची यादी पाहून जेव्हा खरेदीदार कॉल किंवा WhatsApp टॅप करतो, तेव्हाच तुमचा फोन नंबर शेअर केला जातो. तो सार्वजनिकरित्या प्रदर्शित केला जात नाही.",
      faq4_q: "मी विक्रेत्याशी कसा संपर्क साधू?",
      faq4_a: "कोणतीही प्राण्याची यादी उघडा आणि विक्रेता विभागात कॉल, WhatsApp किंवा चॅटवर टॅप करा.",
      faq5_q: "पोस्ट केल्यानंतर मी माझी यादी संपादित करू शकतो का?",
      faq5_a: "होय. माझी यादी वर जा, यादी निवडा आणि संपादित करा टॅप करा. टीप: संपादित केल्याने मंजुरीची स्थिती रीसेट होते.",
      faq6_q: "मी माझे खाते कसे हटवू?",
      faq6_a: "तुमच्या नोंदणीकृत ईमेलसह support@pashusetu.com वर आमच्याशी संपर्क साधा आणि आम्ही ७ कार्य दिवसांत खाते हटवण्याची प्रक्रिया करू.",

      policy1_h: "1. आम्ही गोळा करत असलेली माहिती",
      policy1_b: "आम्ही आमच्या पशुधन बाजार सेवा प्रदान करण्यासाठी तुमचे नाव, फोन नंबर, ईमेल पत्ता आणि स्थान (गाव, तालुका, जिल्हा, राज्य) गोळा करतो. तुम्ही अपलोड केलेले फोटो आणि व्हिडिओ आमच्या सुरक्षित सर्व्हरवर साठवले जातात.",
      policy2_h: "2. आम्ही तुमच्या माहितीचा वापर कसा करतो",
      policy2_b: "तुमची माहिती संभाव्य खरेदीदारांना तुमच्या याद्या दाखवण्यासाठी, तुमची ओळख सत्यापित करण्यासाठी, OTP-आधारित लॉगिन कोड पाठवण्यासाठी आणि आमच्या सेवा सुधारण्यासाठी वापरली जाते. आम्ही तुमचा वैयक्तिक डेटा तृतीय पक्षांना विकत नाही.",
      policy3_h: "3. डेटा स्टोरेज आणि सुरक्षा",
      policy3_b: "सर्व डेटा भारतात होस्ट केलेल्या एन्क्रिप्टेड सर्व्हरवर साठवला जातो. JWT टोकन डिव्हाइस कीचेन (iOS) किंवा कीस्टोअर (Android) चा वापर करून सुरक्षितपणे साठवले जातात. आम्ही उद्योग-मानक सुरक्षा पद्धतींचे पालन करतो.",
      policy4_h: "4. स्थान डेटा",
      policy4_b: "स्थान माहितीचा (गाव, जिल्हा, राज्य) वापर जवळील खरेदीदारांना तुमची यादी दाखवण्यासाठी केला जातो. आम्ही तुमच्या स्पष्ट परवानगीशिवाय GPS समन्वय गोळा करत नाही.",
      policy5_h: "5. मीडिया अपलोड",
      policy5_b: "तुम्ही अपलोड केलेले प्राण्यांचे फोटो आणि व्हिडिओ तुमच्या सार्वजनिक यादीचा भाग बनतात. तुम्ही अपलोड केलेल्या कोणत्याही मीडिया सामायिक करण्याचा अधिकार तुमच्याकडे असल्याची खात्री करा. अपलोड सुरक्षितपणे साठवले जातात आणि तुम्ही यादी काढून टाकल्यावर हटवले जातात.",
      policy6_h: "6. तुमचे अधिकार",
      policy6_b: "तुम्ही support@pashusetu.com वर ईमेल करून तुमचे खाते आणि सर्व संबंधित डेटा हटवण्याची विनंती करू शकता. डेटा हटवणे ७ कार्य दिवसांत केले जाते.",
      policy7_h: "7. संपर्क",
      policy7_b: "गोपनीयतेच्या समस्यांसाठी: support@pashusetu.com",

      terms1_h: "1. स्वीकृती",
      terms1_b: "PashuSetu वापरून, तुम्ही या अटींशी सहमत आहात. आपण सहमत नसल्यास, कृपया ॲप्लिकेशन वापरू नका.",
      terms2_h: "2. पात्रता",
      terms2_b: "PashuSetu वापरण्यासाठी तुमचे वय किमान १८ वर्षे असणे आवश्यक आहे. नोंदणी करून, तुम्ही पुष्टी करता की तुम्ही भारतीय कायद्यानुसार करार करण्यास पात्र आहात.",
      terms3_h: "3. यादी नियम",
      terms3_b: "याद्या वास्तविक आणि अचूक असाव्यात. तुमच्या मालकीचे नसलेले प्राणी पोस्ट करणे, स्टॉक फोटो वापरणे, किंवा प्राण्याचे आरोग्य किंवा वय चुकीचे दर्शवणे सक्त मनाई आहे आणि यामुळे खाते त्वरित निलंबित केले जाईल.",
      terms4_h: "4. अनिवार्य मीडिया",
      terms4_b: "प्रत्येक यादीसाठी विक्री होत असलेल्या वास्तविक प्राण्याचे किमान ५ फोटो आणि एक थेट व्हिडिओ आवश्यक आहे. खरेदीदाराचा विश्वास निर्माण करण्यासाठी हे लागू केले आहे.",
      terms5_h: "5. प्रतिबंधित सामग्री",
      terms5_b: "बेकायदेशीर प्राणी, संरक्षित प्रजाती, किंवा भारतीय वन्यजीव संरक्षण कायद्यांचे उल्लंघन करणारी कोणतीही यादी सक्त मनाई आहे.",
      terms6_h: "6. व्यवहार",
      terms6_b: "PashuSetu हे एक बाजारपेठ मंच आहे. आम्ही खरेदीदार आणि विक्रेते यांच्यात संपर्काची सुविधा देतो परंतु कोणत्याही व्यवहारात पक्षकार नाही. सर्व व्यवहार थेट खरेदीदार आणि विक्रेते यांच्यात होतात.",
      terms7_h: "7. दायित्व",
      terms7_b: "PashuSetu सूचीबद्ध केलेल्या कोणत्याही प्राण्याच्या गुणवत्तेसाठी, आरोग्यासाठी किंवा अचूकतेसाठी जबाबदार नाही. व्यवहार पूर्ण करण्यापूर्वी खरेदीदारांनी प्राण्यांची प्रत्यक्ष खात्री करून घेण्याची शिफारस केली जाते.",
      terms8_h: "8. समाप्ती",
      terms8_b: "आम्ही पूर्वसूचनेशिवाय या अटींचे उल्लंघन करणारी खाती निलंबित किंवा समाप्त करण्याचा अधिकार राखून ठेवतो.",
      terms9_h: "9. लागू कायदा",
      terms9_b: "या अटी भारताच्या कायद्यानुसार चालतात. वाद पुणे, महाराष्ट्र येथील न्यायालयांच्या अखत्यारीत असतील.",
      terms10_h: "10. संपर्क",
      terms10_b: "कायदेशीर चौकशीसाठी: support@pashusetu.com",
      fontSize_small: "लहान",
      fontSize_medium: "मध्यम",
      fontSize_large: "मोठा"
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    
    // Merge nested keys under settings
    if (!content.settings) content.settings = {};
    Object.assign(content.settings, newKeys[lang].settings);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged settings translations into ${lang}.json`);
  }
});
