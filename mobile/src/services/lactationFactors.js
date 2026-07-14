// lactationFactors.js
// Handles lactation-based valuation adjustments and age-based lactation inference.

export const LACTATION_BONUS = {
  cow: {
    1: 1000,
    2: 5000,
    3: 5500,
    4: 4500,
    5: -2000,
    6: -5000,
    elderly: -8000
  },
  buffalo: {
    1: 1500,
    2: 6000,
    3: 6500,
    4: 5500,
    5: -2500,
    6: -6000,
    elderly: -10000
  },
  goat: {
    1: 200,
    2: 1000,
    3: 1200,
    4: 800,
    5: -300,
    6: -1000,
    elderly: -1500
  }
};

export const getLactationBonus = (type, lactationNumber) => {
  const t = String(type || '').toLowerCase();
  const lact = parseInt(lactationNumber, 10) || 1;
  if (!LACTATION_BONUS[t]) return 0;
  
  if (lact >= 7) return LACTATION_BONUS[t].elderly;
  return LACTATION_BONUS[t][lact] || 0;
};

export const inferLactation = (type, ageInYears) => {
  const years = parseFloat(ageInYears) || 0;
  if (type === 'goat') {
    if (years < 1.0) return 0;
    if (years < 2.0) return 1;
    if (years < 3.0) return 2;
    if (years < 4.0) return 3;
    return 4;
  }
  
  // Cattle (Cow / Buffalo)
  if (years < 2.5) return 0;
  if (years < 4.0) return 1;
  if (years < 5.5) return 2;
  if (years < 7.0) return 3;
  if (years < 8.5) return 4;
  if (years < 10.0) return 5;
  return 6;
};
