// merge_locales_estimator.js
// Script to merge estimator translations for English, Hindi, and Marathi.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const estimatorData = {
  en: {
    estimator: {
      title: "Cattle Price Estimator",
      subtitle: "Estimate the fair market price of your cattle",
      steps: {
        header: "Step {{current}} of 10",
        selectAnimal: "Select Animal",
        selectBreed: "Select Breed",
        age: "Age of Animal",
        weight: "Weight (in kg)",
        milkProduction: "Milk Production (Ltrs/day)",
        pregnancy: "Pregnancy Status",
        pregnancyMonth: "Pregnancy Month",
        health: "Health Condition",
        vaccination: "Vaccination Status",
        location: "Location Details",
        verification: "Verification Status"
      },
      animal: {
        cow: "Cow 🐄",
        buffalo: "Buffalo 🐃",
        goat: "Goat 🐐"
      },
      pregnant: {
        yes: "Yes",
        no: "No"
      },
      verified: {
        yes: "Verified",
        no: "Non-Verified"
      },
      actions: {
        calculate: "Calculate Estimated Price",
        recalculate: "Estimate Another Animal",
        next: "Next",
        back: "Back",
        gotoEstimator: "Go to Price Estimator",
        gotoBidding: "Go to Live Bids"
      },
      result: {
        title: "Estimated Value",
        priceRange: "Price Range",
        marketDemand: "Market Demand",
        confidenceScore: "Confidence Score",
        confidenceHelp: "Based on details provided",
        sellingSuggestions: "Selling Suggestions",
        buyingSuggestions: "Buying Suggestions",
        reasoning: "Valuation Reasoning",
        expectedPrice: "Expected Market Price",
        minPrice: "Minimum Price",
        premiumPrice: "Premium Price"
      },
      placeholders: {
        selectState: "Select State",
        selectDistrict: "Select District",
        selectTaluka: "Select Taluka",
        enterVillage: "Enter Village Name (Optional)",
        age: "Enter age in years",
        weight: "Enter weight in kg",
        milk: "Enter milk production in litres"
      },
      input: {
        years: "Years",
        months: "Months"
      },
      breeds: {
        cow: {
          gir: "Gir",
          sahiwal: "Sahiwal",
          hf: "Holstein Friesian (HF)",
          jersey: "Jersey",
          desi: "Desi / Local",
          other: "Other Breed"
        },
        buffalo: {
          murrah: "Murrah",
          surti: "Surti",
          nili_ravi: "Nili Ravi",
          mehsana: "Mehsana",
          local: "Local / Desi",
          other: "Other Breed"
        },
        goat: {
          sirohi: "Sirohi",
          barbari: "Barbari",
          jamnapari: "Jamnapari",
          osmanabadi: "Osmanabadi",
          local: "Local / Desi",
          other: "Other Breed"
        }
      },
      health: {
        excellent: "Excellent",
        good: "Good",
        average: "Average",
        needs_treatment: "Needs Treatment"
      },
      vaccination: {
        complete: "Complete",
        partial: "Partial",
        unknown: "Unknown / None"
      },
      demand: {
        veryHigh: "Very High Demand 🔥",
        high: "High Demand 📈",
        medium: "Moderate Demand ➡️",
        low: "Low Demand 📉"
      },
      suggestions: {
        buy: {
          pregnantCheck: "Check historical calving details and pregnancy verification reports from a vet.",
          treatmentCost: "Factor in veterinary checkup and treatment costs (approx ₹1,000 - ₹2,000).",
          excellentPremium: "Excellent health animals are highly productive; paying a small premium is justified.",
          vaccinationRecord: "Request physical vaccination cards or digital records before purchasing.",
          vaccinationCheck: "Check if FMD and Brucellosis vaccines are due and schedule them immediately.",
          verifiedSecure: "Verified listings have checked location and owner details, lowering purchase risks.",
          unverifiedInspection: "Schedule a physical visit to inspect the animal since it is not verified.",
          localTransport: "Ensure transport permissions and check state boundary rules for livestock."
        },
        sell: {
          pregnantValue: "Advertise the expected delivery date; pregnant cattle command a ₹5,000+ premium.",
          treatmentDisclose: "Be transparent about treatment needs to maintain trust and prevent disputes.",
          excellentHighlight: "Emphasize high activity and shiny coat in listings to justify premium pricing.",
          vaccinationHighlight: "Highlight 'Complete Vaccination' in listing title to attract quick buyers.",
          vaccinationSchedule: "Complete pending vaccinations to raise the market value by 5% to 8%.",
          verifiedPremium: "Get a verified tag on PashuSetu to sell up to 15% faster at better prices.",
          unverifiedTips: "Request verification through the App to get the green verified badge.",
          localMarket: "List location details accurately to get queries from nearby premium buyers."
        }
      },
      reasoning: {
        premiumBreed: "Premium breed adjustment applied based on high market demand.",
        primeAge: "Prime milking/production age range adds valuation premium.",
        depreciatedAge: "Age curve adjustment applied due to early stage or advanced age.",
        milkYieldBonus: "High milk yield significantly increases market price.",
        pregnantBonus: "Pregnancy adds substantial valuation bonus for upcoming offspring.",
        healthExcellent: "Excellent health condition commands a premium over average cattle.",
        healthPoor: "Health condition requires medical treatment, resulting in discounted pricing.",
        verifiedPremium: "Verified status adds 15% trust premium to pricing.",
        unverifiedDiscount: "Unverified listings carry higher risk, resulting in baseline valuation discount.",
        standardCattle: "Standard market baseline valuation parameters applied."
      }
    }
  },
  hi: {
    estimator: {
      title: "पशु बाजार मूल्य अनुमानक",
      subtitle: "खरीदने या बेचने से पहले अपने पशु का उचित बाजार मूल्य जानें",
      steps: {
        header: "चरण {{current}} / 10",
        selectAnimal: "पशु का चयन करें",
        selectBreed: "नस्ल का चयन करें",
        age: "पशु की आयु",
        weight: "वजन (किलोग्राम में)",
        milkProduction: "दूध उत्पादन (लीटर/दिन)",
        pregnancy: "गर्भावस्था की स्थिति",
        pregnancyMonth: "गर्भावस्था का महीना",
        health: "स्वास्थ्य की स्थिति",
        vaccination: "टीकाकरण की स्थिति",
        location: "स्थान का विवरण",
        verification: "सत्यापन की स्थिति"
      },
      animal: {
        cow: "गाय 🐄",
        buffalo: "भैंस 🐃",
        goat: "बकरी 🐐"
      },
      pregnant: {
        yes: "हाँ",
        no: "नहीं"
      },
      verified: {
        yes: "सत्यापित पशु",
        no: "गैर-सत्यापित"
      },
      actions: {
        calculate: "अनुमानित मूल्य की गणना करें",
        recalculate: "अन्य पशु का अनुमान लगाएं",
        next: "आगे बढ़ें",
        back: "पीछे जाएं",
        gotoEstimator: "मूल्य अनुमानक पर जाएं",
        gotoBidding: "लाइव बोली पर जाएं"
      },
      result: {
        title: "अनुमानित मूल्य",
        priceRange: "मूल्य सीमा",
        marketDemand: "बाजार की मांग",
        confidenceScore: "विश्वसनीयता स्कोर",
        confidenceHelp: "दिए गए विवरण के आधार पर",
        sellingSuggestions: "बेचने के सुझाव",
        buyingSuggestions: "खरीदने के सुझाव",
        reasoning: "मूल्यांकन का कारण",
        expectedPrice: "अपेक्षित बाजार मूल्य",
        minPrice: "न्यूनतम मूल्य",
        premiumPrice: "प्रीमियम मूल्य"
      },
      placeholders: {
        selectState: "राज्य चुनें",
        selectDistrict: "जिला चुनें",
        selectTaluka: "तालुका चुनें",
        enterVillage: "गाँव का नाम दर्ज करें (वैकल्पिक)",
        age: "आयु दर्ज करें (वर्षों में)",
        weight: "वजन दर्ज करें (किलोग्राम में)",
        milk: "दूध की मात्रा दर्ज करें (लीटर में)"
      },
      input: {
        years: "वर्ष",
        months: "महीने"
      },
      breeds: {
        cow: {
          gir: "गीर",
          sahiwal: "साहीवाल",
          hf: "एचएफ क्रॉस (HF)",
          jersey: "जर्सी",
          desi: "देशी / स्थानीय",
          other: "अन्य नस्ल"
        },
        buffalo: {
          murrah: "मुर्राह",
          surti: "सुरती",
          nili_ravi: "नीली रावी",
          mehsana: "मेहसाणा",
          local: "स्थानीय / देशी",
          other: "अन्य नस्ल"
        },
        goat: {
          sirohi: "सिरोही",
          barbari: "बरबरी",
          jamnapari: "जमुनापारी",
          osmanabadi: "उस्मानाबादी",
          local: "स्थानीय / देशी",
          other: "अन्य नस्ल"
        }
      },
      health: {
        excellent: "उत्कृष्ट",
        good: "अच्छा",
        average: "सामान्य",
        needs_treatment: "उपचार की आवश्यकता है"
      },
      vaccination: {
        complete: "पूर्ण",
        partial: "आंशिक",
        unknown: "अज्ञात / कोई नहीं"
      },
      demand: {
        veryHigh: "बहुत अधिक मांग 🔥",
        high: "उच्च मांग 📈",
        medium: "मध्यम मांग ➡️",
        low: "कम मांग 📉"
      },
      suggestions: {
        buy: {
          pregnantCheck: "पशु चिकित्सक से गर्भावस्था सत्यापन रिपोर्ट और पिछले बियांत का विवरण जांचें।",
          treatmentCost: "पशु चिकित्सा जांच और उपचार की लागत (लगभग ₹1,000 - ₹2,000) को ध्यान में रखें।",
          excellentPremium: "उत्कृष्ट स्वास्थ्य वाले पशु अत्यधिक उत्पादक होते हैं; थोड़ा प्रीमियम देना उचित है।",
          vaccinationRecord: "खरीदने से पहले भौतिक टीकाकरण कार्ड या डिजिटल रिकॉर्ड मांगें।",
          vaccinationCheck: "जांचें कि क्या एफएमडी और ब्रुसेलोसिस टीके देय हैं और उन्हें तुरंत लगवाएं।",
          verifiedSecure: "सत्यापित विज्ञापनों में स्थान और मालिक के विवरण की जांच होती है, जिससे जोखिम कम होता।",
          unverifiedInspection: "चूंकि पशु सत्यापित नहीं है, इसलिए खरीदने से पहले भौतिक रूप से जाकर निरीक्षण करें।",
          localTransport: "परिवहन अनुमति सुनिश्चित करें और पशुधन के लिए राज्य सीमा के नियमों की जांच करें।"
        },
        sell: {
          pregnantValue: "प्रसव की अपेक्षित तिथि का विज्ञापन करें; गर्भवती पशु पर ₹5,000+ का प्रीमियम मिलता है।",
          treatmentDisclose: "विश्वास बनाए रखने और विवादों से बचने के लिए उपचार की आवश्यकताओं के बारे में पारदर्शी रहें।",
          excellentHighlight: "प्रीमियम मूल्य प्राप्त करने के लिए विज्ञापनों में पशु की सक्रियता और चमकदार त्वचा को उजागर करें।",
          vaccinationHighlight: "त्वरित खरीदारों को आकर्षित करने के लिए विज्ञापन शीर्षक में 'पूर्ण टीकाकरण' लिखें।",
          vaccinationSchedule: "बाजार मूल्य को 5% से 8% तक बढ़ाने के लिए लंबित टीकाकरण पूरे करें।",
          verifiedPremium: "₹15% तक तेजी से और बेहतर मूल्य पर बेचने के लिए पशुसेतु पर सत्यापित टैग प्राप्त करें।",
          unverifiedTips: "हरे रंग का सत्यापित बैज प्राप्त करने के लिए ऐप के माध्यम से सत्यापन का अनुरोध करें।",
          localMarket: "आस-पास के प्रीमियम खरीदारों से पूछताछ प्राप्त करने के लिए स्थान विवरण सटीक रूप से दर्ज करें।"
        }
      },
      reasoning: {
        premiumBreed: "उच्च बाजार मांग के आधार पर प्रीमियम नस्ल समायोजन लागू किया गया।",
        primeAge: "दूध उत्पादन की मुख्य आयु सीमा होने के कारण मूल्य में वृद्धि की गई।",
        depreciatedAge: "प्रारंभिक चरण या अधिक आयु के कारण आयु वक्र समायोजन लागू किया गया।",
        milkYieldBonus: "उच्च दूध उत्पादन बाजार मूल्य को काफी बढ़ा देता है।",
        pregnantBonus: "गर्भावस्था आने वाले बच्चे के कारण मूल्यांकन में महत्वपूर्ण लाभ जोड़ती है।",
        healthExcellent: "उत्कृष्ट स्वास्थ्य स्थिति वाले पशु सामान्य पशु की तुलना में प्रीमियम मूल्य पाते हैं।",
        healthPoor: "स्वास्थ्य स्थिति में चिकित्सा उपचार की आवश्यकता है, जिससे मूल्यांकन में छूट दी गई।",
        verifiedPremium: "सत्यापित स्थिति मूल्यांकन में 15% विश्वास प्रीमियम जोड़ती है।",
        unverifiedDiscount: "गैर-सत्यापित पशुओं में जोखिम अधिक होता है, जिससे मूल मूल्यांकन में छूट दी गई।",
        standardCattle: "मानक बाजार मूल्य निर्धारण मापदंड लागू किए गए।"
      }
    }
  },
  mr: {
    estimator: {
      title: "पशु बाजार मूल्य अंदाजक",
      subtitle: "खरेदी किंवा विक्री करण्यापूर्वी आपल्या जनावराचे योग्य बाजार मूल्य जाणून घ्या",
      steps: {
        header: "टप्पा {{current}} / 10",
        selectAnimal: "पशु निवडा",
        selectBreed: "जात/नस्ल निवडा",
        age: "पशूचे वय",
        weight: "वजन (किलोमध्ये)",
        milkProduction: "दूध उत्पादन (लीटर/दिवस)",
        pregnancy: "गर्भधारणा स्थिती",
        pregnancyMonth: "गर्भधारणेचा महिना",
        health: "आरोग्य स्थिती",
        vaccination: "लसीकरण स्थिती",
        location: "स्थानाचा तपशील",
        verification: "सत्यापन स्थिती"
      },
      animal: {
        cow: "गाय 🐄",
        buffalo: "म्हैस 🐃",
        goat: "शेळी 🐐"
      },
      pregnant: {
        yes: "होय",
        no: "नाही"
      },
      verified: {
        yes: "सत्यापित पशु",
        no: "गैर-सत्यापित"
      },
      actions: {
        calculate: "अंदाजित किंमत काढा",
        recalculate: "दुसऱ्या पशूचा अंदाज घ्या",
        next: "पुढे जा",
        back: "मागे जा",
        gotoEstimator: "किंमत अंदाजककडे जा",
        gotoBidding: "लाइव बोलीकडे जा"
      },
      result: {
        title: "अंदाजित मूल्य",
        priceRange: "किंमत श्रेणी",
        marketDemand: "बाजार मागणी",
        confidenceScore: "विश्वासार्हता स्कोर",
        confidenceHelp: "दिलेल्या तपशीलावर आधारित",
        sellingSuggestions: "विक्रीसाठी मार्गदर्शक",
        buyingSuggestions: "खरेदीसाठी मार्गदर्शक",
        reasoning: "मूल्यांकनाचे कारण",
        expectedPrice: "अपेक्षित बाजार भाव",
        minPrice: "किमान किंमत",
        premiumPrice: "प्रीमियम किंमत"
      },
      placeholders: {
        selectState: "राज्य निवडा",
        selectDistrict: "जिल्हा निवडा",
        selectTaluka: "तालुका निवडा",
        enterVillage: "गावाचे नाव प्रविष्ट करा (पर्यायी)",
        age: "वय प्रविष्ट करा (वर्षांत)",
        weight: "वजन प्रविष्ट करा (किलोमध्ये)",
        milk: "दूध उत्पादन प्रविष्ट करा (लीटरमध्ये)"
      },
      input: {
        years: "वर्षे",
        months: "महिने"
      },
      breeds: {
        cow: {
          gir: "गीर",
          sahiwal: "शाहीवाल",
          hf: "एचएफ क्रॉस (HF)",
          jersey: "जर्सी",
          desi: "देशी / स्थानिक",
          other: "इतर जात"
        },
        buffalo: {
          murrah: "मुर्‍हा",
          surti: "सुरती",
          nili_ravi: "निली रावी",
          mehsana: "महेसाणा",
          local: "स्थानिक / देशी",
          other: "इतर जात"
        },
        goat: {
          sirohi: "शिरोही",
          barbari: "बरबरी",
          jamnapari: "जमुनापारी",
          osmanabadi: "उस्मानाबादी",
          local: "स्थानिक / देशी",
          other: "अंशतः जात"
        }
      },
      health: {
        excellent: "उत्कृष्ट",
        good: "चांगले",
        average: "सामान्य",
        needs_treatment: "उपचारांची गरज आहे"
      },
      vaccination: {
        complete: "पूर्ण",
        partial: "अंशतः",
        unknown: "अज्ञात / काही नाही"
      },
      demand: {
        veryHigh: "खूप जास्त मागणी 🔥",
        high: "चांगली मागणी 📈",
        medium: "मध्यम मागणी ➡️",
        low: "कमी मागणी 📉"
      },
      suggestions: {
        buy: {
          pregnantCheck: "पशुवैद्याकडून गर्भधारणा तपासणी अहवाल आणि मागील वेताचा तपशील तपासा.",
          treatmentCost: "पशुवैद्यकीय तपासणी आणि उपचारांचा खर्च (अंदाजे ₹१,००० - ₹२,०००) लक्षात घ्या.",
          excellentPremium: "उत्कृष्ट आरोग्य असलेले पशू जास्त उत्पादन देतात; थोडी जास्त किंमत देणे योग्य आहे.",
          vaccinationRecord: "खरेदी करण्यापूर्वी प्रत्यक्ष लसीकरण कार्ड किंवा डिजिटल रेकॉर्ड मागून घ्या.",
          vaccinationCheck: "लाळखुरकुत (FMD) आणि ब्रुसेलोसिस लसींची वेळ झाली आहे का ते तपासा आणि लगेच लसीकरण करा.",
          verifiedSecure: "सत्यापित जाहिरातींमध्ये स्थान आणि मालकाच्या तपशीलाची पडताळणी असते, ज्यामुळे फसवणूक टळते.",
          unverifiedInspection: "जनावर सत्यापित नसल्यामुळे खरेदी करण्यापूर्वी प्रत्यक्ष भेट देऊन खात्री करा.",
          localTransport: "वाहतूक परवाना घ्या आणि पशू वाहतुकीसाठी आंतरराज्य सीमा नियमांची खात्री करा."
        },
        sell: {
          pregnantValue: "डिलिव्हरीच्या अपेक्षित तारखेची जाहिरात करा; गाभण पशूला ₹५,०००+ वाढीव किंमत मिळते.",
          treatmentDisclose: "विश्वास टिकवून ठेवण्यासाठी आणि वाद टाळण्यासाठी उपचारांच्या गरजेबद्दल स्पष्ट माहिती द्या.",
          excellentHighlight: "चांगला भाव मिळवण्यासाठी जाहिरातीमध्ये पशूची चपळाई आणि चमकदार त्वचा ठळकपणे दाखवा.",
          vaccinationHighlight: "ग्राहकांना आकर्षित करण्यासाठी जाहिरातीच्या शीर्षकात 'पूर्ण लसीकरण' असा उल्लेख करा.",
          vaccinationSchedule: "बाजार मूल्य ५% ते ८% वाढवण्यासाठी प्रलंबित लसीकरण पूर्ण करा.",
          verifiedPremium: "१५% जलद आणि चांगल्या दराने विक्री करण्यासाठी सत्यापित टॅग मिळवा.",
          unverifiedTips: "हिरवा सत्यापित बॅज मिळवण्यासाठी ॲपद्वारे पडताळणीची विनंती करा.",
          localMarket: "जवळच्या ग्राहकांकडून चौकशी मिळवण्यासाठी स्थानाचा तपशील अचूक भरा."
        }
      },
      reasoning: {
        premiumBreed: "उच्च बाजार मागणीनुसार प्रीमियम जातीसाठी किंमत वाढवण्यात आली.",
        primeAge: "दूध देण्याचे योग्य वय असल्यामुळे मूल्यांकनात वाढ करण्यात आली.",
        depreciatedAge: "सुरुवातीचा टप्पा किंवा अधिक वयामुळे वय वक्र समायोजन लागू केले गेले.",
        milkYieldBonus: "अधिक दूध उत्पादनामुळे बाजार भावात लक्षणीय वाढ होते.",
        pregnantBonus: "गर्भधारणेमुळे yeNaRya वासराच्या/पिल्लाच्या अपेक्षेने मूल्यांकनात वाढ होते.",
        healthExcellent: "उत्कृष्ट आरोग्य स्थितीमुळे पशूला सरासरी दरापेक्षा जास्त किंमत मिळते.",
        healthPoor: "आरोग्य स्थिती खालावलेली असून उपचारांची गरज आहे, ज्यामुळे किंमत कमी केली आहे.",
        verifiedPremium: "सत्यापित स्थितीमुळे मूल्यांकनात १५% विश्वास प्रीमियम जोडला जातो.",
        unverifiedDiscount: "गैर-सत्यापित जनावरांमध्ये जोखीम अधिक असते, ज्यामुळे मूळ किंमत कमी केली आहे.",
        standardCattle: "मानक बाजार मूल्य निर्धारण नियम लागू केले गेले."
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    content.estimator = estimatorData[lang].estimator;
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged estimator translations into ${lang}.json`);
  }
});
