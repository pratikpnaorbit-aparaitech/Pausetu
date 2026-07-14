// marketDemand.js
// Calculates final market demand score, badge background color, and localization tag.

import { getDistrictDemandMultiplier } from './districtDemand';

export const calculateMarketDemand = (params) => {
  const { breed, healthCondition, milkProduction, district, yieldTrend } = params;
  
  let score = 50;
  
  const breedStr = String(breed || '').toLowerCase();
  const popularBreeds = ['gir', 'sahiwal', 'hf', 'murrah', 'sirohi', 'jamnapari'];
  if (popularBreeds.some(p => breedStr.includes(p))) {
    score += 15;
  }
  
  if (healthCondition === 'excellent') score += 15;
  else if (healthCondition === 'average') score -= 10;
  else if (healthCondition === 'needs_treatment') score -= 30;
  
  const milk = parseFloat(milkProduction) || 0;
  if (milk > 15) score += 12;
  else if (milk > 8) score += 6;
  
  if (yieldTrend === 'increasing') score += 10;
  else if (yieldTrend === 'decreasing') score -= 15;
  
  const distMultiplier = getDistrictDemandMultiplier(district);
  score *= distMultiplier;
  
  score = Math.max(10, Math.min(99, score));
  
  if (score >= 80) return { score, labelKey: 'estimator.demand.veryHigh', color: '#16A34A' };
  if (score >= 60) return { score, labelKey: 'estimator.demand.high', color: '#22C55E' };
  if (score >= 40) return { score, labelKey: 'estimator.demand.medium', color: '#EAB308' };
  return { score, labelKey: 'estimator.demand.low', color: '#EF4444' };
};
export default calculateMarketDemand;
