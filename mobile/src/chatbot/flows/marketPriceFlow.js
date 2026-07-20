export const marketPriceFlow = {
  id: 'marketPrice',
  titleKey: 'premiumAdvisor.guidedChat.flows.marketPrice.title',
  startStep: 'animal',
  steps: {
    animal: {
      id: 'animal',
      questionKey: 'premiumAdvisor.guidedChat.questions.animal',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.cow', value: 'Cow' },
        { labelKey: 'premiumAdvisor.guidedChat.options.buffalo', value: 'Buffalo' }
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
            { labelKey: 'premiumAdvisor.guidedChat.options.jersey', value: 'Jersey' }
          ];
        } else {
          return [
            { labelKey: 'premiumAdvisor.guidedChat.options.murrah', value: 'Murrah' }
          ];
        }
      },
      nextStep: 'weight'
    },
    weight: {
      id: 'weight',
      questionKey: 'premiumAdvisor.guidedChat.questions.weight',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.weightUnder300', value: 'Under 300 kg' },
        { labelKey: 'premiumAdvisor.guidedChat.options.weightAbove300', value: 'Above 300 kg' }
      ],
      nextStep: null
    }
  }
};
