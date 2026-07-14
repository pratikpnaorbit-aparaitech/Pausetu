export const vaccinationPlannerFlow = {
  id: 'vaccinationPlanner',
  titleKey: 'premiumAdvisor.guidedChat.flows.vaccinationPlanner.title',
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
      nextStep: 'lastVaccine'
    },
    lastVaccine: {
      id: 'lastVaccine',
      questionKey: 'premiumAdvisor.guidedChat.questions.lastVaccine',
      type: 'choice',
      options: [
        { labelKey: 'premiumAdvisor.guidedChat.options.fmd', value: 'FMD Vaccine' },
        { labelKey: 'premiumAdvisor.guidedChat.options.hs', value: 'HS Vaccine' },
        { labelKey: 'premiumAdvisor.guidedChat.options.none', value: 'None' }
      ],
      nextStep: null
    }
  }
};
