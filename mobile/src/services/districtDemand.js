// districtDemand.js
// Handles district demand scoring multipliers.

export const DISTRICT_DEMAND_MULTIPLIERS = {
  pune: 1.05,
  satara: 1.02,
  ahmednagar: 1.00,
  anand: 1.08,
  jaipur: 1.03,
  lucknow: 1.02,
  other: 1.0
};

export const getDistrictDemandMultiplier = (district) => {
  const d = String(district || '').toLowerCase();
  return DISTRICT_DEMAND_MULTIPLIERS[d] || DISTRICT_DEMAND_MULTIPLIERS.other;
};
