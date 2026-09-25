import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000
});

// Keep authentication at the API boundary. Components using this shared client
// do not need to repeat the Authorization header for every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/') window.location.assign('/');
    }
    return Promise.reject(error);
  }
);

const unwrap = (response) => response.data;

export const getLines = () => api.get('/lines').then(unwrap);
export const getDiseaseTypes = () => api.get('/disease-types').then(unwrap);
export const getDetections = (params) => api.get('/detections', { params }).then(unwrap);
export const getLedgers = (params) => api.get('/ledgers', { params }).then(unwrap);
export const getDetail = (id) => api.get(`/details/${id}`).then(unwrap);

export default api;
