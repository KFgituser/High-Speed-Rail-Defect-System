import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000
});

const unwrap = (response) => response.data;

export const getLines = () => api.get('/lines').then(unwrap);
export const getDiseaseTypes = () => api.get('/disease-types').then(unwrap);
export const getDetections = (params) => api.get('/detections', { params }).then(unwrap);
export const getLedgers = (params) => api.get('/ledgers', { params }).then(unwrap);
export const getDetail = (id) => api.get(`/details/${id}`).then(unwrap);

export default api;
