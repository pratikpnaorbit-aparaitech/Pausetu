export const diseaseCheckerFlow = {
  id: 'diseaseChecker',
  titleKey: 'premiumAdvisor.guidedChat.flows.diseaseChecker.title',
  startStep: 'animal',
  steps: {
    animal: {
      id: 'animal',
      questionKey: 'premiumAdvisor.guidedChat.questions.animal',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.cow', value: 'Cow' },
        { labelKey: 'premiumAdvisor.guidedChat.options.goat', value: 'Goat' }
      ],
      nextStep: 'symptom'
    },
    symptom: {
      id: 'symptom',
      questionKey: 'premiumAdvisor.guidedChat.questions.symptom',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.fever', value: 'High Fever' },
        { labelKey: 'premiumAdvisor.guidedChat.options.noAppetite', value: 'Loss of Appetite' },
        { labelKey: 'premiumAdvisor.guidedChat.options.limping', value: 'Limping' }
      ],
      nextStep: null
    }
  }
};
