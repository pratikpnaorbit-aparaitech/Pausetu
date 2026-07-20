// diseaseFactors.js
// Handles disease deductions based on animal type and specific disease history.

export const DISEASE_DEDUCTIONS = {
  cow: {
    none: 0,
    mastitis: -12000,
    fmd: -8000,
    lameness: -6000,
    other: -4000
  },
  buffalo: {
    none: 0,
    mastitis: -15000,
    fmd: -10000,
    lameness: -7000,
    other: -5000
  },
  goat: {
    none: 0,
    mastitis: -3000,
    fmd: -2000,
    lameness: -1500,
    other: -1000
  }
};

export const getDiseaseDeduction = (type, disease) => {
  const t = String(type || '').toLowerCase();
  const dis = String(disease || 'none').toLowerCase();
  if (!DISEASE_DEDUCTIONS[t]) return 0;
  return DISEASE_DEDUCTIONS[t][dis] || DISEASE_DEDUCTIONS[t].other || 0;
};
