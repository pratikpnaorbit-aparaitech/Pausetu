import instance from './api';

/**
 * Fetch active subscription plans
 */
export const getActivePlans = async () => {
  return instance.get('/subscriptions/plans');
};

/**
 * Fetch user subscription status
 */
export const getSubscriptionStatus = async () => {
  return instance.get('/subscriptions/status');
};

/**
 * Create Razorpay Order for purchasing a plan
 */
export const createRazorpayOrder = async (planId) => {
  return instance.post('/subscriptions/create-order', { planId });
};

/**
 * Verify Razorpay Payment Signature
 */
export const verifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature, planId }) => {
  return instance.post('/subscriptions/verify-payment', {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    planId
  });
};

/**
 * Cancel active subscription
 */
export const cancelSubscription = async () => {
  return instance.post('/subscriptions/cancel');
};

export default {
  getActivePlans,
  getSubscriptionStatus,
  createRazorpayOrder,
  verifyPayment,
  cancelSubscription
};
