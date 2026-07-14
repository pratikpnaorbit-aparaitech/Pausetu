// priceFactors.js
// Standard base parameters, age multiplier curves, and weight factors.

export const BASE_PRICES = {
  cow: 35000,
  buffalo: 50000,
  goat: 8000,
};

export const VACCINATION_MULTIPLIERS = {
  complete: 1.08,
  partial: 1.0,
  unknown: 0.9,
};

export const getAgeMultiplier = (type, ageInYears) => {
  const years = parseFloat(ageInYears) || 0;
  if (type === 'goat') {
    if (years < 0.5) return 0.7;
    if (years < 1.0) return 0.9;
    if (years <= 2.5) return 1.2;
    if (years <= 4.0) return 0.9;
    return 0.6;
  } else {
    if (years < 1.0) return 0.6;
    if (years < 2.0) return 0.85;
    if (years <= 5.0) return 1.15;
    if (years <= 7.0) return 0.95;
    if (years <= 10.0) return 0.75;
    return 0.5;
  }
};

export const getWeightFactor = (type, weightKg) => {
  const w = parseFloat(weightKg) || 0;
  const baseWeights = {
    cow: 350,
    buffalo: 450,
    goat: 35,
  };
  
  const baseWeight = baseWeights[type] || 350;
  const scale = type === 'goat' ? 0.008 : 0.0012;
  const deviation = w - baseWeight;
  const factor = 1.0 + (deviation * scale);
  return Math.max(0.6, Math.min(1.5, factor));
};
