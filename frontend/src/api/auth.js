import api from './index.js';

export const login = (credentials) => api.post('/login', credentials).then((response) => response.data);
