import api from './index.js';

export const getVisualizationFiles = () => api.get('/files').then((response) => response.data);

export const analyzeVisualizationFile = (filename) => {
  const form = new URLSearchParams();
  form.set('filename', filename);
  return api.post('/analyze', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }).then((response) => response.data);
};
