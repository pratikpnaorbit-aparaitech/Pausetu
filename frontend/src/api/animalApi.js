import axios from './axios';

export const animalApi = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const res = await axios.get(`/animals?${params}`);
    if (res && res.status === 'success' && res.data) {
      return res.data.animals;
    }
    throw new Error(res?.message || 'Failed to fetch animals');
  },
  getById: async (id) => {
    const res = await axios.get(`/animals/${id}`);
    if (res && res.status === 'success' && res.data) {
      return res.data.animal;
    }
    throw new Error(res?.message || 'Failed to fetch animal details');
  },
  // Admin-only dedicated approve endpoint — POST to /animals/:id/approve
  approve: async (id) => {
    const res = await axios.patch(`/animals/${id}/approve`);
    if (res && res.status === 'success') {
      return res.data;
    }
    throw new Error(res?.message || 'Failed to approve listing');
  },
  // Admin-only dedicated reject endpoint — sends mandatory reason in body
  reject: async (id, reason) => {
    const res = await axios.patch(`/animals/${id}/reject`, { reason });
    if (res && res.status === 'success') {
      return res.data;
    }
    throw new Error(res?.message || 'Failed to reject listing');
  }
};
