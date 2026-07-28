import instance from './api';

export const reviewApi = {
  getUserReview: async () => {
    return instance.get('/reviews/my');
  },

  submitReview: async (reviewData) => {
    return instance.post('/reviews', reviewData);
  },
};

export default reviewApi;
