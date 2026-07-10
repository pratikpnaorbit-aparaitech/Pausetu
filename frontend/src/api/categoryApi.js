import axios from './axios';

export const categoryApi = {
  getAll: async () => {
    const res = await axios.get('/categories');
    if (res && res.status === 'success' && res.data) {
      return res.data.categories;
    }
    throw new Error(res?.message || 'Failed to fetch categories');
  },
  create: async (payload) => {
    const res = await axios.post('/categories', payload);
    if (res && res.status === 'success' && res.data) {
      return res.data.category;
    }
    throw new Error(res?.message || 'Failed to create category');
  }
};
