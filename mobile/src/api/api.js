import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

let logoutCallback = null;

// Secure Storage helpers
export const secureStorage = {
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (e) {
      await AsyncStorage.setItem(key, value);
    }
  },
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (e) {
      return await AsyncStorage.getItem(key);
    }
  },
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      await AsyncStorage.removeItem(key);
    }
  }
};

// Register session expiry callback
export const registerLogoutHandler = (callback) => {
  logoutCallback = callback;
};

// Interceptor to inject bearer token
instance.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getItem('userToken');
    if (token && token !== 'guest' && token !== 'null' && token !== 'undefined') {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle session expiration or network failures
instance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const status = error.response ? error.response.status : null;
    const requestUrl = error.config?.url || 'unknown';
    const requestMethod = (error.config?.method || 'unknown').toUpperCase();

    console.log(`[API Interceptor] ${requestMethod} ${requestUrl} → ${status}`);

    // Only logout on 401 (token invalid/expired) — NOT on 403 (access denied/ownership check).
    // A 403 means the token is valid but the user lacks permission; that is NOT a session expiry.
    const token = await secureStorage.getItem('userToken');
    if (status === 401 && token && token !== 'guest') {
      console.warn('[Session Expiry] Token is unauthorized or expired, logging out...');
      if (logoutCallback) {
        await logoutCallback();
      }
    }

    // Standardize error formats for toast displays
    let message = 'API request failed';
    if (!error.response) {
      message = 'Network error. Please check your internet connection.';
    } else if (error.response.data && error.response.data.message) {
      message = error.response.data.message;
    } else if (status === 500) {
      message = 'Internal server error. Please try again later.';
    } else if (status === 404) {
      message = 'Requested resources not found.';
    }

    return Promise.reject(new Error(message));
  }
);

export const api = {
  // Authentication (Email OTP based)
  sendOtp: async (phoneNumberOrEmail) => {
    const email = phoneNumberOrEmail.includes('@') 
      ? phoneNumberOrEmail 
      : `${phoneNumberOrEmail}@pashusetu.com`;
    return instance.post('/auth/send-otp', { email }, { timeout: 25000 });
  },

  verifyOtp: async (phoneNumberOrEmail, otp) => {
    const email = phoneNumberOrEmail.includes('@') 
      ? phoneNumberOrEmail 
      : `${phoneNumberOrEmail}@pashusetu.com`;
    return instance.post('/auth/verify-otp', { email, otp });
  },

  // User Profile
  getProfile: async () => {
    return instance.get('/profile');
  },

  updateProfile: async (profileData) => {
    return instance.put('/profile', profileData);
  },

  // Categories & Breeds
  getCategories: async () => {
    return instance.get('/categories');
  },

  getBreeds: async (categoryId) => {
    const url = categoryId ? `/breeds?categoryId=${categoryId}` : '/breeds';
    return instance.get(url);
  },

  // Locations master lists
  getStates: async () => {
    return instance.get('/states');
  },

  getDistricts: async (stateId) => {
    return instance.get(`/districts?stateId=${stateId}`);
  },

  // Animals listing CRUD
  getAnimals: async (filters = {}) => {
    const query = Object.keys(filters)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(filters[k])}`)
      .join('&');
    return instance.get(`/animals?${query}`);
  },

  getRecommendedAnimals: async () => {
    return instance.get('/animals/recommended');
  },
  
  // Submit a complaint for an animal listing
  submitComplaint: async (data) => {
    return instance.post('/complaints', data);
  },

  getAnimalById: async (id) => {
    return instance.get(`/animals/${id}`);
  },

  createAnimal: async (animalData) => {
    return instance.post('/animals', animalData);
  },

  updateAnimal: async (id, animalData) => {
    return instance.patch(`/animals/${id}`, animalData);
  },

  deleteAnimal: async (id) => {
    return instance.delete(`/animals/${id}`);
  },

  // Notifications
  getMyNotifications: async () => {
    return instance.get('/notifications');
  },

  markAsRead: async (id) => {
    return instance.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return instance.patch('/notifications/read-all');
  },

  deleteNotification: async (id) => {
    return instance.delete(`/notifications/${id}`);
  },

  // Favorites
  getFavorites: async () => {
    return instance.get('/buyers/favorites');
  },

  toggleFavorite: async (animalId) => {
    return instance.post('/buyers/favorites', { animalId });
  }
};

export const resolveMediaUrl = (photo) => {
  if (!photo) return 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80';
  
  let targetUrl = '';
  if (typeof photo === 'string') {
    targetUrl = photo.trim();
  } else if (typeof photo === 'object') {
    targetUrl = (photo.fileUrl || photo.url || photo.uri || photo.path || '').trim();
  }
  
  if (!targetUrl || targetUrl === 'null' || targetUrl === 'undefined') return 'https://images.unsplash.com/photo-1546445317-29f4545e6d52?auto=format&fit=crop&w=300&q=80';
  if (targetUrl.startsWith('http')) return targetUrl;
  
  const pathPart = targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`;
  const serverHost = API_BASE_URL.replace('/api', '');
  return `${serverHost}${pathPart}`;
};

export default instance;
