// confidenceEngine.js
// Evaluates parameters to calculate a dynamic confidence score (0-100%).

export const calculateConfidence = (data) => {
  let score = 30; // base baseline
  
  // 1. Data completeness (+30 points max)
  let completeness = 0;
  if (data.animalType) completeness += 5;
  if (data.breed) completeness += 5;
  if (data.age) completeness += 5;
  if (data.weight) completeness += 5;
  if (data.milkProduction !== undefined) completeness += 5;
  if (data.location?.district) completeness += 5;
  score += completeness;
  
  // 2. Verification level (+20 points max)
  const verLvl = String(data.verificationLevel || 'none').toLowerCase();
  if (verLvl === 'health_report_uploaded') score += 20;
  else if (verLvl === 'documents_verified') score += 18;
  else if (verLvl === 'video_verified') score += 15;
  else if (verLvl === 'photos_verified') score += 10;
  
  // 3. Breed certainty (+15 points max)
  if (data.breed && data.breed !== 'other' && data.breed !== 'local') {
    score += 15;
  } else {
    score += 5;
  }
  
  // 4. Market freshness & Location accuracy (+20 points max)
  if (data.location?.district && data.location?.state) {
    score += 15;
    if (data.location?.taluka) score += 5;
  }
  
  // 5. Health information (+15 points max)
  if (data.healthCondition && data.healthCondition !== 'average') {
    score += 15;
  } else if (data.healthCondition) {
    score += 10;
  }
  
  return Math.max(10, Math.min(98, Math.round(score)));
};
export default calculateConfidence;
