// breedFactors.js
// Breed quality scores configuration and accessor function.

export const BREED_SCORES = {
  cow: {
    gir: 15000,
    sahiwal: 12000,
    hf: 18000,
    jersey: 10000,
    desi: 2000,
    other: 4000
  },
  buffalo: {
    murrah: 25000,
    surti: 10000,
    nili_ravi: 15000,
    mehsana: 12000,
    local: 3000,
    other: 5000
  },
  goat: {
    sirohi: 2500,
    barbari: 3000,
    jamnapari: 4500,
    osmanabadi: 2000,
    local: 500,
    other: 1000
  }
};

export const getBreedQualityScore = (type, breed) => {
  const t = String(type || '').toLowerCase();
  const b = String(breed || '').toLowerCase();
  if (!BREED_SCORES[t]) return 0;
  return BREED_SCORES[t][b] || BREED_SCORES[t].other || 0;
};
