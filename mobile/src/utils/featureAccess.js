/**
 * featureAccess.js — Centralized Premium & Free Feature Access Resolver
 * Checks active subscription status AND admin free feature flags.
 */

/**
 * Evaluates whether a user has access to a specific feature.
 * @param {Object} userProfile Current logged-in user profile object
 * @param {Object} settings Global system settings from admin verification API
 * @param {string} featureName 'feedPlanner' | 'marketEstimator' | 'marketPrice' | 'aiAdvisor'
 * @returns {boolean} True if access is allowed (Premium OR Admin Free flag)
 */
export function hasFeatureAccess(userProfile, settings = null, featureName = '') {
  if (!userProfile) return false;

  // ---------------------------------------------------------
  // CONDITION A: USER HAS AN ACTIVE PREMIUM SUBSCRIPTION
  // ---------------------------------------------------------
  const now = new Date();
  const isPremiumActive = !!(
    userProfile.isPremium === true ||
    userProfile.subscriptionStatus === 'active' ||
    userProfile.subscription?.status === 'active' ||
    (userProfile.premiumExpiresAt && new Date(userProfile.premiumExpiresAt) > now)
  );

  if (isPremiumActive) {
    return true;
  }

  // ---------------------------------------------------------
  // CONDITION B: ADMIN HAS MARKED THE FEATURE AS FREE / UNLOCKED
  // ---------------------------------------------------------
  if (featureName === 'feedPlanner') {
    const isGlobalFree = !!(
      settings?.feedPlannerGlobalUnlock ||
      settings?.feedPlannerFree ||
      settings?.feedPlanner?.free
    );
    const isUserUnlocked = !!(userProfile.feedPlannerAccess?.hasAccess);
    return isGlobalFree || isUserUnlocked;
  }

  if (featureName === 'marketEstimator' || featureName === 'marketPrice') {
    const isGlobalFree = !!(
      settings?.marketPriceGlobalUnlock ||
      settings?.marketEstimatorFree ||
      settings?.marketEstimator?.free
    );
    const isUserUnlocked = !!(userProfile.marketPriceAccess?.hasAccess);
    return isGlobalFree || isUserUnlocked;
  }

  if (featureName === 'aiAdvisor' || featureName === 'guidedChat') {
    const isGlobalFree = !!(
      settings?.aiAdvisorGlobalUnlock ||
      settings?.aiAdvisorFree ||
      settings?.aiAdvisor?.free
    );
    return isGlobalFree;
  }

  return false;
}

export default hasFeatureAccess;
