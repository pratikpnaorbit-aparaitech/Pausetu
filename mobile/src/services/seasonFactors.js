// seasonFactors.js
// Handles season adjustments and detects the current season based on device calendar month.

export const SEASON_BONUSES = {
  cow: {
    summer: -2000,
    monsoon: 1500,
    winter: 2500,
    festival: 4000
  },
  buffalo: {
    summer: -3000,
    monsoon: 2000,
    winter: 3500,
    festival: 5000
  },
  goat: {
    summer: -500,
    monsoon: 500,
    winter: 800,
    festival: 3000
  }
};

export const getSeasonBonus = (type, season) => {
  const t = String(type || '').toLowerCase();
  const s = String(season || 'winter').toLowerCase();
  if (!SEASON_BONUSES[t]) return 0;
  return SEASON_BONUSES[t][s] || 0;
};

export const getCurrentSeason = () => {
  const month = new Date().getMonth(); // 0-11
  // March - May
  if (month >= 2 && month <= 4) return 'summer';
  // June - September
  if (month >= 5 && month <= 8) return 'monsoon';
  // October - November (Festival season in India)
  if (month >= 9 && month <= 10) return 'festival';
  // December - February
  return 'winter';
};
