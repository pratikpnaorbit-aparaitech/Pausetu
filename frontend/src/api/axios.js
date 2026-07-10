import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pashusetu_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Graceful response formatting
instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.warn('[API Warning] API request failed, falling back to mock database storage:', error.message);
    return Promise.reject(error);
  }
);

export default instance;
export { API_BASE_URL };
