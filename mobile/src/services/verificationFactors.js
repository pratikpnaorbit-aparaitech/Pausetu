// verificationFactors.js
// Handles verification bonuses based on the specific verification level.

export const VERIFICATION_LEVEL_BONUS = {
  none: 0,
  photos_verified: 2500,
  video_verified: 4000,
  documents_verified: 5000,
  health_report_uploaded: 7000
};

export const getVerificationLevelBonus = (level) => {
  const lvl = String(level || 'none').toLowerCase();
  return VERIFICATION_LEVEL_BONUS[lvl] || 0;
};
