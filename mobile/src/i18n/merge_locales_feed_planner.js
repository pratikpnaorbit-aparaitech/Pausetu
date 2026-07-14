// merge_locales_feed_planner.js
// Merges localized translation strings for Feed Planner Phase 4.

const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'locales');
const languages = ['en', 'hi', 'mr'];

const newData = {
  en: {
    feedPlanner: {
      title: "AI Feed Planner",
      chat: {
        qAnimal: "Which animal do you want to create a feed plan for?",
        qBreed: "Which breed is your {{animal}}?",
        qWeight: "What is the estimated weight of your {{animal}}?",
        qMilk: "What is the daily milk production of your {{animal}}?",
        qPregnant: "Is the {{animal}} pregnant?",
        qGoal: "What is the primary feeding goal?",
        qGreen: "Is green fodder available on your farm?",
        confirmInfo: "Please review the summary. Is this information correct?",
        generating: "AI is calculating optimum feed recipe...",
        completedNotice: "Feeding plan generated. Tap Restart to create a new plan.",
        summaryCard: "Cattle Summary",
        unlockTitle: "Unlock AI Feed Planner",
        unlockSubtitle: "Get custom feeding recommendations for ₹1 only",
        lockDesc: "🔒 Lifetime AI Feed Planner access is locked. Unlock now for just ₹1.",
        benefitTitle1: "Balanced Feed Ratios",
        benefitDesc1: "Get exact weight recommendations for dry fodder, green fodder, and concentrates.",
        benefitTitle2: "Increase Milk Yield",
        benefitDesc2: "Scientifically proven concentrate mixes to boost milk production.",
        benefitTitle3: "Cost Optimization",
        benefitDesc3: "Avoid expensive feed waste by utilizing local farm residues.",
        resultsTitle: "AI Suggested Feed Plan",
        greenFodder: "Green Fodder",
        dryFodder: "Dry Fodder",
        concentrate: "Concentrate Feed",
        cottonSeedCake: "Cotton Seed Cake",
        mineralMixture: "Mineral Mixture",
        salt: "Salt",
        water: "Daily Water Need",
        dailyCost: "Est. Daily Feed Cost",
        monthlyCost: "Est. Monthly Cost",
        milkImprovement: "Expected Milk Gain",
        tipsTitle: "Advisory Tips",
        warningsTitle: "Health Warnings",
        maharashtraNote: "✔ Suitable for Maharashtra climate and livestock"
      },
      actions: {
        generate: "Generate Feed Plan",
        edit: "Edit Information"
      },
      animal: {
        cow: "Cow 🐄",
        buffalo: "Buffalo 🐃"
      },
      breeds: {
        cow: {
          jersey: "Jersey",
          hf: "HF (Holstein Friesian)",
          gir: "Gir",
          sahiwal: "Sahiwal",
          desi: "Desi (Local)",
          other: "Other"
        },
        buffalo: {
          murrah: "Murrah",
          mehsana: "Mehsana",
          surti: "Surti",
          pandharpuri: "Pandharpuri",
          local: "Local / Desi",
          other: "Other"
        }
      },
      options: {
        weight: {
          lt_300: "Below 300 kg",
          w300_400: "300–400 kg",
          w400_500: "400–500 kg",
          gt_500: "Above 500 kg"
        },
        milk: {
          dry: "Dry Animal (0 L)",
          m5_10: "5–10 L",
          m10_15: "10–15 L",
          m15_20: "15–20 L",
          gt_20: "Above 20 L"
        },
        pregnant: {
          yes: "Yes",
          no: "No"
        },
        goal: {
          inc_milk: "Increase Milk",
          gain_wt: "Weight Gain",
          maintenance: "Maintenance",
          preg_support: "Pregnancy Support"
        },
        green: {
          yes: "Yes, Available",
          no: "No, Not Available"
        }
      }
    }
  },
  hi: {
    feedPlanner: {
      title: "एआई चारा योजना",
      chat: {
        qAnimal: "आप किस पशु के लिए चारा योजना बनाना चाहते हैं?",
        qBreed: "आपके {{animal}} की नस्ल क्या है?",
        qWeight: "आपके {{animal}} का अनुमानित वजन क्या है?",
        qMilk: "आपके {{animal}} का दैनिक दूध उत्पादन कितना है?",
        qPregnant: "क्या {{animal}} गर्भवती है?",
        qGoal: "चारा खिलाने का मुख्य लक्ष्य क्या है?",
        qGreen: "क्या आपके खेत में हरा चारा उपलब्ध है?",
        confirmInfo: "कृपया सारांश की समीक्षा करें। क्या यह जानकारी सही है?",
        generating: "एआई इष्टतम चारा नुस्खा की गणना कर रहा है...",
        completedNotice: "चारा योजना तैयार है। नई योजना बनाने के लिए रीस्टार्ट पर टैप करें।",
        summaryCard: "पशु सारांश",
        unlockTitle: "एआई चारा योजना अनलॉक करें",
        unlockSubtitle: "केवल ₹1 में कस्टम चारा नियोजन प्राप्त करें",
        lockDesc: "🔒 आजीवन एआई चारा योजना पहुंच लॉक है। अभी केवल ₹1 में अनलॉक करें।",
        benefitTitle1: "संतुलित चारा अनुपात",
        benefitDesc1: "सूखे चारे, हरे चारे और पशु आहार के लिए सटीक वजन सिफारिशें प्राप्त करें।",
        benefitTitle2: "दूध उत्पादन बढ़ाएं",
        benefitDesc2: "दूध उत्पादन बढ़ाने के लिए वैज्ञानिक रूप से प्रमाणित चारा मिश्रण।",
        benefitTitle3: "लागत नियंत्रण",
        benefitDesc3: "स्थानीय संसाधनों का कुशलतापूर्वक उपयोग करके अतिरिक्त खर्चों को कम करें।",
        resultsTitle: "एआई सुझाया गया चारा नियोजन",
        greenFodder: "हरा चारा",
        dryFodder: "सूखा चारा",
        concentrate: "पशु आहार (पेंड/धान्य)",
        cottonSeedCake: "कपास बीज खली (सरसों)",
        mineralMixture: "खनिज मिश्रण",
        salt: "नमक",
        water: "दैनिक पानी की आवश्यकता",
        dailyCost: "अनुमानित दैनिक लागत",
        monthlyCost: "अनुमानित मासिक लागत",
        milkImprovement: "अपेक्षित दूध वृद्धि",
        tipsTitle: "सलाह और सुझाव",
        warningsTitle: "स्वास्थ्य चेतावनियाँ",
        maharashtraNote: "✔ महाराष्ट्र की जलवायु और पशुधन के लिए उपयुक्त"
      },
      actions: {
        generate: "चारा योजना बनाएं",
        edit: "जानकारी बदलें"
      },
      animal: {
        cow: "गाय 🐄",
        buffalo: "भैंस 🐃"
      },
      breeds: {
        cow: {
          jersey: "जर्सी",
          hf: "एचएफ (होलस्टीन फ्रीजियन)",
          gir: "गीर",
          sahiwal: "साहीवाल",
          desi: "देशी",
          other: "अन्य"
        },
        buffalo: {
          murrah: "मुर्रा",
          mehsana: "मेहसाणा",
          surti: "सुरती",
          pandharpuri: "पंढरपुरी",
          local: "देशी / स्थानीय",
          other: "अन्य"
        }
      },
      options: {
        weight: {
          lt_300: "300 किलो से कम",
          w300_400: "300–400 किलो",
          w400_500: "400–500 किलो",
          gt_500: "500 किलो से अधिक"
        },
        milk: {
          dry: "दूध नहीं (0 लीटर)",
          m5_10: "5–10 लीटर",
          m10_15: "10–15 लीटर",
          m15_20: "15–20 लीटर",
          gt_20: "20 लीटर से अधिक"
        },
        pregnant: {
          yes: "हाँ",
          no: "नहीं"
        },
        goal: {
          inc_milk: "दूध बढ़ाना",
          gain_wt: "वजन बढ़ाना",
          maintenance: "शरीर रखरखाव",
          preg_support: "गर्भावस्था सहायता"
        },
        green: {
          yes: "हाँ, उपलब्ध है",
          no: "नहीं, उपलब्ध नहीं है"
        }
      }
    }
  },
  mr: {
    feedPlanner: {
      title: "एआय चारा नियोजन",
      chat: {
        qAnimal: "तुम्हाला कोणत्या प्राण्यासाठी चारा नियोजन करायचे आहे?",
        qBreed: "तुमच्या {{animal}} ची जात कोणती आहे?",
        qWeight: "तुमच्या {{animal}} चे अंदाजे वजन किती आहे?",
        qMilk: "तुमच्या {{animal}} चे दैनिक दूध उत्पादन किती आहे?",
        qPregnant: "तुमचा {{animal}} गाभण आहे का?",
        qGoal: "चारा देण्याचे मुख्य उद्दिष्ट काय आहे?",
        qGreen: "तुमच्या शेतात हिरवा चारा उपलब्ध आहे का?",
        confirmInfo: "कृपया सारांश तपासा. ही माहिती बरोबर आहे का?",
        generating: "एआय संतुलित चारा नियोजनाची मोजणी करत आहे...",
        completedNotice: "चारा नियोजन तयार आहे. नवीन नियोजन करण्यासाठी रीस्टार्ट दाबा.",
        summaryCard: "पशू सारांश",
        unlockTitle: "एआय चारा नियोजन अनलॉक करा",
        unlockSubtitle: "फक्त ₹१ मध्ये संतुलित पशूखाद्य नियोजन मिळवा",
        lockDesc: "🔒 आजीवन एआय चारा नियोजन प्रवेश लॉक आहे. आता फक्त ₹१ मध्ये अनलॉक करा.",
        benefitTitle1: "संतुलित चारा प्रमाण",
        benefitDesc1: "ओला चारा, सुका चारा आणि पशूखाद्याच्या अचूक वजनाची शिफारस मिळवा.",
        benefitTitle2: "दूध उत्पादन वाढवा",
        benefitDesc2: "दूध उत्पादन वाढवण्यासाठी वैज्ञानिकदृष्ट्या प्रमाणित पशूखाद्य प्रमाण.",
        benefitTitle3: "खर्च कमी करा",
        benefitDesc3: "शेतातील उपलब्ध साधनांचा योग्य वापर करून खाद्यावरील अतिरिक्त खर्च वाचवा.",
        resultsTitle: "एआय संतुलित चारा नियोजन शिफारस",
        greenFodder: "हिरवा ओला चारा",
        dryFodder: "सुका चारा",
        concentrate: "पशूखाद्य / सरकी पेंड",
        cottonSeedCake: "सरकी पेंड",
        mineralMixture: "खनिज मिश्रण (मिनरल मिक्स्चर)",
        salt: "मीठ",
        water: "दैनिक पाण्याची गरज",
        dailyCost: "अंदाजे दैनिक चारा खर्च",
        monthlyCost: "अंदाजे मासिक चारा खर्च",
        milkImprovement: "दूध उत्पादनातील वाढ",
        tipsTitle: "पशू संगोपन सल्ला",
        warningsTitle: "आरोग्य चेतावणी",
        maharashtraNote: "✔ महाराष्ट्रातील हवामान आणि पशूंसाठी योग्य"
      },
      actions: {
        generate: "चारा नियोजन तयार करा",
        edit: "माहिती बदला"
      },
      animal: {
        cow: "गाय 🐄",
        buffalo: "म्हैस 🐃"
      },
      breeds: {
        cow: {
          jersey: "जर्सी",
          hf: "एचएफ (एच.एफ. गाय)",
          gir: "गीर",
          sahiwal: "साहिवाल",
          desi: "गावरान / देशी",
          other: "इतर"
        },
        buffalo: {
          murrah: "मुऱ्हा",
          mehsana: "मेहसाणा",
          surti: "सुरती",
          pandharpuri: "पंढरपुरी म्हैस",
          local: "गावरान म्हैस",
          other: "इतर"
        }
      },
      options: {
        weight: {
          lt_300: "३०० किलोपेक्षा कमी",
          w300_400: "३००–४०० किलो",
          w400_500: "४००–५०० किलो",
          gt_500: "५०० किलोपेक्षा जास्त"
        },
        milk: {
          dry: "दूध नाही (गाभण/काढलेले)",
          m5_10: "५–१० लीटर",
          m10_15: "१०–१५ लीटर",
          m15_20: "१५–२० लीटर",
          gt_20: "२० लीटरपेक्षा जास्त"
        },
        pregnant: {
          yes: "होय",
          no: "नाही"
        },
        goal: {
          inc_milk: "दूध वाढवणे",
          gain_wt: "वजन वाढवणे",
          maintenance: "शरीर तंदुरुस्ती राखणे",
          preg_support: "गाभण काळातील पोषण"
        },
        green: {
          yes: "होय, उपलब्ध आहे",
          no: "नाही, उपलब्ध नाही"
        }
      }
    }
  }
};

languages.forEach((lang) => {
  const file = path.join(localesPath, `${lang}.json`);
  if (fs.existsSync(file)) {
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!content.feedPlanner) content.feedPlanner = {};
    
    Object.assign(content.feedPlanner, newData[lang].feedPlanner);
    
    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Merged Feed Planner translations into ${lang}.json`);
  }
});
