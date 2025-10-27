import axios from 'axios';

// Backend API Configuration for MVP1
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    const firebaseToken = localStorage.getItem('firebaseToken');
    if (firebaseToken) {
      config.headers.Authorization = `Bearer ${firebaseToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('firebaseToken');
      localStorage.removeItem('firebaseId');
      localStorage.removeItem('athleteId');
    }
    
    return Promise.reject(error);
  }
);

export default api;
