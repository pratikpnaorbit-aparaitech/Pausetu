import axios from './axios';

export const reviewApi = {
  getAdminReviews: async (filters = {}) => {
    const query = Object.keys(filters)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`)
      .join('&');
    return axios.get(`/admin/reviews${query ? `?${query}` : ''}`);
  },

  getAdminReviewStats: async () => {
    return axios.get('/admin/reviews/stats');
  },

  updateAdminReview: async (id, data) => {
    return axios.patch(`/admin/reviews/${id}`, data);
  },

  deleteAdminReview: async (id) => {
    return axios.delete(`/admin/reviews/${id}`);
  },
};

export default reviewApi;
