import instance from './api';

export const animalApi = {
  getCategories: async () => {
    return instance.get('/categories');
  },

  getBreeds: async (categoryId) => {
    const url = categoryId ? `/breeds?categoryId=${categoryId}` : '/breeds';
    return instance.get(url);
  },

  getStates: async () => {
    return instance.get('/states');
  },

  getDistricts: async (stateId) => {
    const url = stateId ? `/districts?stateId=${stateId}` : '/districts';
    return instance.get(url);
  },

  getTalukas: async (districtId) => {
    const url = districtId ? `/talukas?districtId=${districtId}` : '/talukas';
    return instance.get(url);
  },

  getVillages: async (talukaId) => {
    const url = talukaId ? `/villages?talukaId=${talukaId}` : '/villages';
    return instance.get(url);
  },

  uploadFile: async (formData, onProgress) => {
    // Calls the backend POST /api/uploads endpoint
    return instance.post('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000, // 2 minutes timeout for large media files
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      }
    });
  },

  createAnimal: async (animalData) => {
    return instance.post('/animals', animalData);
  },

  getMyListings: async (sellerId, filters = {}) => {
    const query = Object.keys(filters)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`)
      .join('&');
    const url = `/animals?sellerId=${sellerId}${query ? `&${query}` : ''}`;
    return instance.get(url);
  },

  deleteAnimal: async (id) => {
    return instance.delete(`/animals/${id}`);
  },

  updateAnimal: async (id, data) => {
    return instance.patch(`/animals/${id}`, data);
  }
};

export default animalApi;
