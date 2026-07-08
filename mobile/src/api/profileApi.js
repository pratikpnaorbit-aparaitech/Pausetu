import instance from './api';

export const profileApi = {
  getProfile: async () => {
    return instance.get('/profile');
  },

  updateProfile: async (profileData) => {
    return instance.put('/profile', profileData);
  },

  uploadPhoto: async (formData, onProgress) => {
    return instance.post('/profile/upload-photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      }
    });
  }
};

export default profileApi;
