export const PLANS = [
  {
    id: 'monthly',
    price: 99,
    titleKey: 'premiumAdvisor.paymentScreen.monthlyPlanTitle',
    priceKey: 'premiumAdvisor.paymentScreen.monthlyPlanPrice',
    descKey: 'premiumAdvisor.paymentScreen.monthlyPlanDesc',
    savingKey: 'premiumAdvisor.paymentScreen.monthlyPlanDesc',
    icon: 'calendar-outline',
  },
  {
    id: 'yearly',
    price: 499,
    titleKey: 'premiumAdvisor.paymentScreen.yearlyPlanTitle',
    priceKey: 'premiumAdvisor.paymentScreen.yearlyPlanPrice',
    descKey: 'premiumAdvisor.paymentScreen.yearlyPlanDesc',
    savingKey: 'premiumAdvisor.paymentScreen.yearlyPlanDesc',
    icon: 'ribbon-outline',
  }
];

export const PAYMENT_PROVIDERS = [
  { id: 'upi', name: 'Google Pay / PhonePe (UPI)', logo: 'phone' },
  { id: 'card', name: 'Debit / Credit Card', logo: 'card-outline' },
  { id: 'netbanking', name: 'Net Banking', logo: 'business-outline' }
];

export const SUGGESTED_QUESTIONS_KEYS = [
  { id: 'suggest1', key: 'premiumAdvisor.suggestions.suggest1' },
  { id: 'suggest2', key: 'premiumAdvisor.suggestions.suggest2' },
  { id: 'suggest3', key: 'premiumAdvisor.suggestions.suggest3' },
  { id: 'suggest4', key: 'premiumAdvisor.suggestions.suggest4' },
  { id: 'suggest5', key: 'premiumAdvisor.suggestions.suggest5' }
];
