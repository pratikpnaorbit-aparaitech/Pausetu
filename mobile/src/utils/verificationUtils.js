/**
 * Single Source of Truth helper for checking user verification status.
 * Returns true if the user's milk receipt / dairy verification is approved.
 */
export const isUserVerified = (userProfile) => {
  if (!userProfile) return false;

  const status = userProfile?.verification?.status || userProfile?.verificationStatus;
  
  // Status check (approved or verified)
  if (status === 'approved' || status === 'verified') return true;

  // Timestamp check (approvedAt exists)
  if (userProfile?.verification?.approvedAt) return true;

  // Boolean flag check
  if (userProfile?.isVerified === true) return true;

  return false;
};
