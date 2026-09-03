import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 180000, // 3 minutes to support multimodal vision + OCR + forensics without timeout
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trustid_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session unauthorized or token expired.");
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  getProfile: () => api.get('/api/auth/me'),
  sendOtp: (data) => api.post('/api/auth/send-otp', data),
  verifyRegister: (data) => api.post('/api/auth/verify-register', data),
};

export const screeningsAPI = {
  list: (params) => api.get('/api/screenings', { params }),
  get: (id) => api.get(`/api/screenings/${id}`),
  getById: (id) => api.get(`/api/screenings/${id}`),
  create: (formData) => api.post('/api/screenings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000
  }),
  analyze: (id) => api.post(`/api/screenings/${id}/analyze`, null, { timeout: 180000 }),
  retry: (id) => api.post(`/api/screenings/${id}/retry`),
  runOcr: (id) => api.post(`/api/screenings/${id}/ocr`),
  runValidation: (id) => api.post(`/api/screenings/${id}/validate`),
  runTampering: (id) => api.post(`/api/screenings/${id}/tampering`),
  runFace: (id) => api.post(`/api/screenings/${id}/face`),
  runRisk: (id) => api.post(`/api/screenings/${id}/risk`),
  updateNotes: (id, notes) => api.put(`/api/screenings/${id}/notes`, { notes }),
  downloadPdf: (id) => api.get(`/api/reports/${id}/pdf`, { responseType: 'blob' })
};

export const aiAPI = {
  analyze: (screeningId) => api.post(`/api/ai/analyze/${screeningId}`),
  get: (screeningId) => api.get(`/api/ai/analyze/${screeningId}`)
};

export const reportsAPI = {
  get: (id) => api.get(`/api/reports/${id}`),
  downloadPdf: (id) => api.get(`/api/reports/${id}/pdf`, { responseType: 'blob' })
};

export const auditAPI = {
  getTrail: (params) => api.get('/api/audit', { params })
};

export const analyticsAPI = {
  getDashboard: () => api.get('/api/dashboard'),
  getSystemAnalytics: () => api.get('/api/admin/analytics')
};

export const usersAPI = {
  list: () => api.get('/api/users'),
  updateRole: (id, role) => api.put(`/api/users/${id}/role`, { role }),
  updateStatus: (id, is_active) => api.put(`/api/users/${id}/status`, { is_active })
};

export default api;
