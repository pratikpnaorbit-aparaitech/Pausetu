import axios from './axios';

/**
 * Fetch Subscription Dashboard KPI Metrics & Analytics
 */
export const getSubscriptionDashboard = async () => {
  return axios.get('/admin/subscriptions/dashboard');
};

/**
 * Fetch all Subscription Plans
 */
export const getAllPlans = async () => {
  return axios.get('/admin/subscriptions/plans');
};

/**
 * Create a new Subscription Plan
 */
export const createPlan = async (planData) => {
  return axios.post('/admin/subscriptions/plans', planData);
};

/**
 * Update an existing Subscription Plan
 */
export const updatePlan = async (id, planData) => {
  return axios.put(`/admin/subscriptions/plans/${id}`, planData);
};

/**
 * Delete a Subscription Plan
 */
export const deletePlan = async (id) => {
  return axios.delete(`/admin/subscriptions/plans/${id}`);
};

/**
 * Toggle Plan active/inactive status
 */
export const togglePlanStatus = async (id) => {
  return axios.patch(`/admin/subscriptions/plans/${id}/toggle`, {});
};

/**
 * Fetch Subscribers Directory with optional filters
 */
export const getSubscribers = async (params = {}) => {
  return axios.get('/admin/subscriptions/subscribers', { params });
};

/**
 * Fetch Payment Transactions log
 */
export const getTransactions = async (params = {}) => {
  return axios.get('/admin/subscriptions/transactions', { params });
};
