// healthFactors.js
// Handles Body Condition Score (BCS) multipliers and Udder Condition adjustments.

export const BCS_MULTIPLIERS = {
  poor: 0.7,
  average: 0.9,
  good: 1.1,
  excellent: 1.25
};

export const getBcsMultiplier = (bcs) => {
  const b = String(bcs || 'good').toLowerCase();
  return BCS_MULTIPLIERS[b] || BCS_MULTIPLIERS.good;
};

export const getUdderConditionBonus = (type, condition) => {
  const t = String(type || '').toLowerCase();
  const cond = String(condition || 'normal').toLowerCase();
  
  if (cond === 'healthy') {
    return t === 'goat' ? 500 : 2500;
  }
  if (cond === 'damaged') {
    return t === 'goat' ? -2000 : -8000;
  }
  return 0; // normal
};
