export const feedPlannerFlow = {
  id: 'feedPlanner',
  titleKey: 'premiumAdvisor.guidedChat.flows.feedPlanner.title',
  startStep: 'animal',
  steps: {
    animal: {
      id: 'animal',
      questionKey: 'premiumAdvisor.guidedChat.questions.animal',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.cow', value: 'Cow' },
        { labelKey: 'premiumAdvisor.guidedChat.options.buffalo', value: 'Buffalo' },
        { labelKey: 'premiumAdvisor.guidedChat.options.goat', value: 'Goat' }
      ],
      nextStep: 'breed'
    },
    breed: {
      id: 'breed',
      questionKey: 'premiumAdvisor.guidedChat.questions.breed',
      type: 'choice',
      options: (answers) => {
        if (answers.animal === 'Cow') {
          return [
            { labelKey: 'premiumAdvisor.guidedChat.options.gir', value: 'Gir' },
            { labelKey: 'premiumAdvisor.guidedChat.options.sahiwal', value: 'Sahiwal' },
            { labelKey: 'premiumAdvisor.guidedChat.options.hf', value: 'HF' },
            { labelKey: 'premiumAdvisor.guidedChat.options.jersey', value: 'Jersey' }
          ];
        } else if (answers.animal === 'Buffalo') {
          return [
            { labelKey: 'premiumAdvisor.guidedChat.options.murrah', value: 'Murrah' },
            { labelKey: 'premiumAdvisor.guidedChat.options.jaffarabadi', value: 'Jaffarabadi' },
            { labelKey: 'premiumAdvisor.guidedChat.options.mehsana', value: 'Mehsana' }
          ];
        } else {
          return [
            { labelKey: 'premiumAdvisor.guidedChat.options.osmanabadi', value: 'Osmanabadi' },
            { labelKey: 'premiumAdvisor.guidedChat.options.boer', value: 'Boer' },
            { labelKey: 'premiumAdvisor.guidedChat.options.sirohi', value: 'Sirohi' }
          ];
        }
      },
      nextStep: 'age'
    },
    age: {
      id: 'age',
      questionKey: 'premiumAdvisor.guidedChat.questions.age',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.age1_2', value: '1-2 Years' },
        { labelKey: 'premiumAdvisor.guidedChat.options.age3_5', value: '3-5 Years' },
        { labelKey: 'premiumAdvisor.guidedChat.options.ageAbove5', value: 'Above 5 Years' }
      ],
      nextStep: 'milk'
    },
    milk: {
      id: 'milk',
      questionKey: 'premiumAdvisor.guidedChat.questions.milk',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.milkUnder10', value: 'Under 10 L/day' },
        { labelKey: 'premiumAdvisor.guidedChat.options.milk10_15', value: '10-15 L/day' },
        { labelKey: 'premiumAdvisor.guidedChat.options.milkAbove15', value: 'Above 15 L/day' }
      ],
      nextStep: 'weight'
    },
    weight: {
      id: 'weight',
      questionKey: 'premiumAdvisor.guidedChat.questions.weight',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.weightUnder300', value: 'Under 300 kg' },
        { labelKey: 'premiumAdvisor.guidedChat.options.weight300_400', value: '300-400 kg' },
        { labelKey: 'premiumAdvisor.guidedChat.options.weightAbove400', value: 'Above 400 kg' }
      ],
      nextStep: 'pregnant'
    },
    pregnant: {
      id: 'pregnant',
      questionKey: 'premiumAdvisor.guidedChat.questions.pregnant',
      type: 'choice',
      options: [
        { labelKey: 'common.yes', value: 'Yes' },
        { labelKey: 'common.no', value: 'No' }
      ],
      nextStep: (answers) => answers.pregnant === 'Yes' ? 'pregnancyMonth' : 'goal'
    },
    pregnancyMonth: {
      id: 'pregnancyMonth',
      questionKey: 'premiumAdvisor.guidedChat.questions.pregnancyMonth',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.preg1_3', value: '1-3 Months' },
        { labelKey: 'premiumAdvisor.guidedChat.options.preg3_6', value: '3-6 Months' },
        { labelKey: 'premiumAdvisor.guidedChat.options.preg6_9', value: '6-9 Months' }
      ],
      nextStep: 'goal'
    },
    goal: {
      id: 'goal',
      questionKey: 'premiumAdvisor.guidedChat.questions.goal',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.goalIncrease', value: 'Increase Milk Production' },
        { labelKey: 'premiumAdvisor.guidedChat.options.goalMaintenance', value: 'Maintenance' },
        { labelKey: 'premiumAdvisor.guidedChat.options.goalGrowth', value: 'Growth' }
      ],
      nextStep: 'feed'
    },
    feed: {
      id: 'feed',
      questionKey: 'premiumAdvisor.guidedChat.questions.feed',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.feedGreen', value: 'Green Fodder' },
        { labelKey: 'premiumAdvisor.guidedChat.options.feedDry', value: 'Dry Fodder' },
        { labelKey: 'premiumAdvisor.guidedChat.options.feedConcentrate', value: 'Concentrates' },
        { labelKey: 'premiumAdvisor.guidedChat.options.feedMixed', value: 'Mixed' }
      ],
      nextStep: 'water'
    },
    water: {
      id: 'water',
      questionKey: 'premiumAdvisor.guidedChat.questions.water',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.waterConstant', value: 'Constant' },
        { labelKey: 'premiumAdvisor.guidedChat.options.waterIntervals', value: '2-3 Times a Day' },
        { labelKey: 'premiumAdvisor.guidedChat.options.waterScarce', value: 'Scarce' }
      ],
      nextStep: null
    }
  }
};
