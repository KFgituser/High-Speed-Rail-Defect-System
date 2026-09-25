import api from './index.js';

const exportPaths = {
  left: '/export-detection',
  right: '/export-ledger',
  all: '/export-all'
};

export const downloadExport = (type, params) =>
  api.get(exportPaths[type] || exportPaths.all, { params, responseType: 'blob' });

export const downloadDetail = (id) =>
  api.get(`/export-detail/${encodeURIComponent(id)}`, { responseType: 'blob' });
