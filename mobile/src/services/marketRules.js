// marketRules.js
// Handles market demand estimation and dynamically selects localized tips/suggestions keys.

export const getDemandStatus = (params) => {
  const { breed, healthCondition, milkProduction, isVerified } = params;
  
  let score = 50; // baseline score out of 100
  
  const breedStr = String(breed || '').toLowerCase();
  const popularBreeds = ['gir', 'sahiwal', 'hf', 'murrah', 'sirohi', 'jamnapari'];
  if (breedStr && popularBreeds.some(p => breedStr.includes(p))) {
    score += 15;
  }
  
  if (healthCondition === 'excellent') score += 15;
  else if (healthCondition === 'average') score -= 10;
  else if (healthCondition === 'needs_treatment') score -= 35;
  
  const milk = parseFloat(milkProduction) || 0;
  if (milk > 15) score += 15;
  else if (milk > 8) score += 8;
  
  if (isVerified) score += 10;
  
  score = Math.max(10, Math.min(99, score));
  
  if (score >= 80) return { score, labelKey: 'estimator.demand.veryHigh', color: '#16A34A' };
  if (score >= 60) return { score, labelKey: 'estimator.demand.high', color: '#22C55E' };
  if (score >= 40) return { score, labelKey: 'estimator.demand.medium', color: '#EAB308' };
  return { score, labelKey: 'estimator.demand.low', color: '#EF4444' };
};

export const getSuggestions = (params) => {
  const { healthCondition, vaccinationStatus, isVerified } = params;
  
  const buying = [];
  const selling = [];
  
  // Pregnancy check
  if (params.isPregnant) {
    buying.push('estimator.suggestions.buy.pregnantCheck');
    selling.push('estimator.suggestions.sell.pregnantValue');
  }
  
  // Health
  if (healthCondition === 'needs_treatment') {
    buying.push('estimator.suggestions.buy.treatmentCost');
    selling.push('estimator.suggestions.sell.treatmentDisclose');
  } else {
    buying.push('estimator.suggestions.buy.excellentPremium');
    selling.push('estimator.suggestions.sell.excellentHighlight');
  }
  
  // Vaccination
  if (vaccinationStatus === 'complete') {
    buying.push('estimator.suggestions.buy.vaccinationRecord');
    selling.push('estimator.suggestions.sell.vaccinationHighlight');
  } else {
    buying.push('estimator.suggestions.buy.vaccinationCheck');
    selling.push('estimator.suggestions.sell.vaccinationSchedule');
  }
  
  // Verification
  if (isVerified) {
    buying.push('estimator.suggestions.buy.verifiedSecure');
    selling.push('estimator.suggestions.sell.verifiedPremium');
  } else {
    buying.push('estimator.suggestions.buy.unverifiedInspection');
    selling.push('estimator.suggestions.sell.unverifiedTips');
  }
  
  // Location
  buying.push('estimator.suggestions.buy.localTransport');
  selling.push('estimator.suggestions.sell.localMarket');
  
  return {
    buying: buying.slice(0, 3),
    selling: selling.slice(0, 3)
  };
};
