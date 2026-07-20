/**
 * Simulated AI Advisor Service
 * Evaluates farmer queries and responds with contextual, farmer-friendly advice
 * in the user's selected language (en, hi, mr).
 */

const getMockResponse = (message, lang = 'en') => {
  const msg = message.toLowerCase();
  
  const responses = {
    en: {
      milk: `To increase daily milk production, try these practical guidelines:
1. **Balanced Feeding**: Give 15-20 kg green fodder, 5-6 kg dry fodder, and 1 kg balanced cattle feed for every 2-2.5 litres of milk.
2. **Clean Water**: Cows need 70-80 litres of clean water daily. Ensure they have access to water 24 hours a day.
3. **Bypass Protein**: Feeding 100-150 grams of bypass fat or bypass protein daily can improve yield.
4. **Regular Milking**: Milk the cows at fixed timings every day. Comfort and stress-free environment are critical.`,
      feed: `Balanced Fodder Proportion:
1. **Green Fodder**: High in moisture and vitamins. Feed Maize, Sorghum, or Berseem.
2. **Dry Fodder**: Essential for fiber. Feed Wheat straw (Bhusa) or Paddy straw.
3. **Concentrate Mix**: Mixture of grains, mustard cake (khali), wheat bran (chokar), and 2% mineral mixture.
Always mix fodder in a 60% green and 40% dry ratio.`,
      mastitis: `⚠️ **Warning / Action Required for Mastitis (Thnela):**
Mastitis is a serious udder infection. Do the following immediately:
1. **Cleanliness**: Wash the udder with potassium permanganate (lal dava) water before and after milking.
2. **Dry milking**: Use full-hand milking, not stripping (knuckling).
3. **Isolate**: Milk the infected cow last and discard the milk.
4. **Vet Call**: Please call a veterinary doctor immediately for antibiotic treatment to prevent permanent damage.`,
      calf: `Newborn Calf Care Guidelines:
1. **Colostrum (Kheesa/Chika)**: Feed the calf colostrum within 1 hour of birth. It must be 10% of the calf's body weight.
2. **Warmth**: Keep the calf in a clean, warm, and dry place away from direct wind.
3. **Cord Care**: Clean the naval cord with Iodine solution to prevent infection.`,
      summer: `Summer Green Fodder Management:
1. Grow drought-resistant green fodder like Sorghum (Jowar), Pearl Millet (Bajra), and Cowpea.
2. Provide silage or hay if fresh green fodder is unavailable.
3. Feed animals in the cooler hours (early morning and evening) to avoid heat stress.`,
      default: `Hello! I am your PashuSetu AI Advisor. 
I can guide you on:
- How to increase milk production
- Fodder mixtures and diet charts
- Identifying cattle illness (e.g., mastitis, fever)
- Calf care and summer planning

Please ask a question about your farm in simple words (e.g., "how to increase milk yield", "feeding tips").`
    },
    hi: {
      milk: `पशुओं का दूध उत्पादन बढ़ाने के लिए इन आसान सुझावों का पालन करें:
1. **संतुलित आहार**: रोजाना 15-20 किलो हरा चारा, 5-6 किलो सूखा चारा और प्रत्येक 2 से 2.5 लीटर दूध पर 1 किलो संतुलित पशु आहार (खली-चोकर) दें।
2. **साफ पानी**: एक गाय/भैंस को रोज 70-80 लीटर पानी की जरूरत होती है। उन्हें 24 घंटे साफ पानी पीने की सुविधा दें।
3. **बाईपास फैट**: दूध बढ़ाने के लिए रोज 100-150 ग्राम बाईपास फैट या प्रोटीन चारे में मिलाकर दें।
4. **समय पर दुहना**: रोज एक ही निश्चित समय पर दूध निकालें। पशु को शांत और तनावमुक्त रखें।`,
      feed: `पशु के लिए संतुलित चारे का अनुपात:
1. **हरा चारा**: मक्का, ज्वार या बरसीम खिलाएं। यह पशु को ऊर्जा और विटामिन देता है।
2. **सूखा चारा**: गेहूं का भूसा या धान का पुआल खिलाएं, जो फाइबर के लिए जरूरी है।
3. **पशु आहार (दाना मिश्रण)**: अनाज, सरसों या बिनौले की खली, चोकर और 2% मिनरल मिक्सचर (खनिज मिश्रण) मिलाकर दें।
हमेशा 60% हरा चारा और 40% सूखा चारा मिलाकर खिलाएं।`,
      mastitis: `⚠️ **थनैला रोग (Mastitis) के लिए जरूरी चेतावनी:**
थनैला थनों का एक गंभीर संक्रमण है। तुरंत ये कदम उठाएं:
1. **स्वच्छता**: दूध दुहने से पहले और बाद में थनों को लाल दवा (पोटैशियम परमैंगनेट) के पानी से धोएं।
2. **दुहने का सही तरीका**: दूध निकालते समय पूरे हाथ का उपयोग करें (मुट्ठी बांधकर), अंगूठे से थन को न दबाएं।
3. **अलग रखें**: बीमार पशु का दूध अंत में निकालें और उसे फेंक दें।
4. **डॉक्टर से संपर्क**: तुरंत किसी रजिस्टर्ड पशु चिकित्सक को बुलाएं और एंटीबायोटिक इलाज शुरू कराएं।`,
      calf: `नवजात बछड़े/बछिया की देखभाल के नियम:
1. **खीस (पेउसी/colostrum)**: जन्म के 1 घंटे के भीतर बछड़े को मां का पहला गाढ़ा दूध (खीस) जरूर पिलाएं। यह बछड़े के वजन का 10% होना चाहिए।
2. **गर्म स्थान**: बछड़े को ठंडी हवा से बचाएं और साफ, सूखी जगह पर रखें।
3. **नाभि की देखभाल**: संक्रमण से बचाने के लिए नाभि पर टिंचर आयोडीन लगाएं।`,
      summer: `गर्मी में हरे चारे का प्रबंधन:
1. गर्मी सहने वाली फसलें जैसे ज्वार, बाजरा और लोबिया उगाएं।
2. यदि हरा चारा न हो, तो साइलेज (silage) या सूखी घास का प्रयोग करें।
3. पशुओं को गर्मी से बचाने के लिए सुबह और शाम के ठंडे समय में ही चारा खिलाएं।`,
      default: `नमस्ते! मैं आपका पशुसेतु एआई सलाहकार हूं।
मैं आपकी इन विषयों में मदद कर सकता हूँ:
- दूध उत्पादन कैसे बढ़ाएं
- पशुओं के संतुलित आहार और चारे की जानकारी
- थनैला या बुखार जैसी बीमारियों की पहचान
- बछड़े की देखभाल और गर्मियों में चारे का प्रबंधन

कृपया अपने फार्म से जुड़ा कोई भी सवाल आसान शब्दों में पूछें (जैसे "दूध कैसे बढ़ाएं", "हरा चारा कैसे खिलाएं")।`
    },
    mr: {
      milk: `जनावरंचे दूध उत्पादन वाढवण्यासाठी खालील सोप्या टिप्स फॉलो करा:
1. **संतुलित आहार**: रोज १५-२० किलो हिरवा चारा, ५-६ किलो सुका चारा आणि प्रत्येक २ ते २.५ लीटर दुधासाठी १ किलो संतुलित पशू खाद्य (पेंड/चाळण) द्या.
2. **स्वच्छ पाणी**: एका गाईला/म्हशीला रोज ७०-८० लीटर पाण्याची गरज असते. २४ तास स्वच्छ पाणी उपलब्ध ठेवा.
3. **बायपास फॅट**: दूध वाढवण्यासाठी रोज १००-१५० ग्रॅम बायपास फॅट किंवा बायपास प्रोटीन चाऱ्यात मिक्स करून द्या.
4. **दूध काढण्याची वेळ**: रोज एकाच निश्चित वेळेवर दूध काढा. जनावराला शांत आणि ताणमुक्त वातावरणात ठेवा.`,
      feed: `जनावरांच्या संतुलित चाऱ्याचे नियोजन:
1. **हिरवा चारा**: मका, ज्वार किंवा लसूण घास द्या. यातून जनावरांना पाणी आणि जीवनसत्त्वे मिळतात.
2. **सुका चारा**: गव्हाचा कोंडा (कुटार) किंवा भाताचा पेंढा द्या, जो पचनासाठी आवश्यक असतो.
3. **पशू खाद्य (खुराक)**: धान्य, सरकी पेंड किंवा खोबरेल पेंड, चोकर आणि २% मिनरल मिक्स्चर (खनिज मिश्रण) एकत्र करून द्या.
चाऱ्यामध्ये नेहमी ६०% हिरवा आणि ४०% सुका चारा असे प्रमाण ठेवावे.`,
      mastitis: `⚠️ **मस्टायटीस (थनेला/दगडी) आजारासाठी महत्त्वाची चेतावणी:**
हा सडाचा अतिशय गंभीर आजार आहे. त्वरित खालील उपाय करा:
1. **स्वच्छता**: दूध काढण्यापूर्वी आणि काढल्यानंतर सड लाल औषधाच्या (पोटॅशियम परमॅंगनेट) पाण्याने स्वच्छ धुवावे.
2. **दूध काढण्याची पद्धत**: दूध काढताना पूर्ण हाताचा (मुठीचा) वापर करा, अंगठ्याने सड दाबू नका.
3. **बाधित जनावर बाजूला ठेवा**: आजारी जनावराचे दूध शेवटी काढा आणि ते दूध नष्ट करा.
4. **डॉक्टरांचा सल्ला**: सड खराब होऊ नये म्हणून त्वरित पशुवैद्यकीय डॉक्टरांना बोलवून अँटीबायोटिक उपचार सुरू करा.`,
      calf: `नवजात वासराची काळजी घेण्याचे नियम:
1. **चीक (पहिला दूध/Colostrum)**: वासराच्या जन्मानंतर पहिल्या १ तासाच्या आत त्याला गाईचा चीक नक्की पाजा. हे वासराच्या वजनाच्या १०% असावे.
2. **उबदार जागा**: वासराला थंड हवेपासून वाचवा आणि स्वच्छ, कोरड्या जागी ठेवा.
3. **नाळ स्वच्छ ठेवा**: जंतूसंसर्ग टाळण्यासाठी वासराच्या नाळेवर आयोडीन लावा.`,
      summer: `उन्हाळ्यात हिरव्या चाऱ्याचे नियोजन:
1. उन्हाळ्यात तग धरणाऱ्या चारा पिकांची लागवड करा, जसे की ज्वार, बाजरी आणि चवळी.
2. हिरवा चारा कमी असल्यास सायलेज (मुरघास) किंवा सुक्या पेंढ्याचा वापर करा.
3. जनावरांना उन्हाचा त्रास होऊ नये म्हणून सकाळी आणि संध्याकाळी थंड वेळेत चारा द्या.`,
      default: `नमस्कार! मी तुमचा पशुसेतू एआय सल्लागार आहे.
मी तुम्हाला खालील गोष्टींमध्ये मदत करू शकतो:
- दूध उत्पादन कसे वाढवावे
- जनावरांच्या संतुलित आहाराचे आणि खाद्याचे नियोजन
- मस्टायटीस (थनेला) किंवा तापाची लक्षणे ओळखणे
- वासराची काळजी आणि उन्हाळ्यातील नियोजन

कृपया तुमच्या फार्मशी संबंधित कोणताही प्रश्न सोप्या शब्दांत विचारा (उदा. "दूध कसे वाढवायचे", "पशू खाद्य काय द्यावे").`
    }
  };

  const currentResponses = responses[lang] || responses.en;
  
  if (msg.includes('milk') || msg.includes('yield') || msg.includes('production') || msg.includes('दूध') || msg.includes('दुध') || msg.includes('वाढ')) {
    return currentResponses.milk;
  }
  if (msg.includes('feed') || msg.includes('fodder') || msg.includes('diet') || msg.includes('चारा') || msg.includes('खाद्य') || msg.includes('खुराक') || msg.includes('पेंड')) {
    return currentResponses.feed;
  }
  if (msg.includes('mastitis') || msg.includes('thnela') || msg.includes('udder') || msg.includes('थनैला') || msg.includes('थनेला') || msg.includes('सड') || msg.includes('मस्टायटीस') || msg.includes('दगडी')) {
    return currentResponses.mastitis;
  }
  if (msg.includes('calf') || msg.includes('born') || msg.includes('बछड़ा') || msg.includes('बछिया') || msg.includes('वासरा') || msg.includes('जन्म') || msg.includes('खीस') || msg.includes('चीक')) {
    return currentResponses.calf;
  }
  if (msg.includes('summer') || msg.includes('dry') || msg.includes('heat') || msg.includes('गर्मी') || msg.includes('उन्हाळा') || msg.includes('तापमान')) {
    return currentResponses.summer;
  }
  
  return currentResponses.default;
};

module.exports = {
  getMockResponse
};
