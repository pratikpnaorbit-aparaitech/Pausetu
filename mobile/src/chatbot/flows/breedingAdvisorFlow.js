export const breedingAdvisorFlow = {
  id: 'breedingAdvisor',
  titleKey: 'premiumAdvisor.guidedChat.flows.breedingAdvisor.title',
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
      nextStep: 'insemination'
    },
    insemination: {
      id: 'insemination',
      questionKey: 'premiumAdvisor.guidedChat.questions.insemination',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.natural', value: 'Natural Service' },
        { labelKey: 'premiumAdvisor.guidedChat.options.artificial', value: 'Artificial Insemination' }
      ],
      nextStep: null
    }
  }
};
