import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (userData: any) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/me'),
  updateProfile: (userData: any) => api.put('/api/auth/me', userData),
};

export const farmsAPI = {
  getFarms: () => api.get('/api/farms'),
  getFarm: (id: number) => api.get(`/api/farms/${id}`),
  createFarm: (farmData: any) => api.post('/api/farms', farmData),
  updateFarm: (id: number, farmData: any) => api.put(`/api/farms/${id}`, farmData),
  deleteFarm: (id: number) => api.delete(`/api/farms/${id}`),
  getFields: (farmId: number) => api.get(`/api/farms/${farmId}/fields`),
  createField: (farmId: number, fieldData: any) =>
    api.post(`/api/farms/${farmId}/fields`, fieldData),
  getCrops: (fieldId: number) => api.get(`/api/farms/fields/${fieldId}/crops`),
  createCrop: (fieldId: number, cropData: any) =>
    api.post(`/api/farms/fields/${fieldId}/crops`, cropData),
};

export const monitoringAPI = {
  getPlantHealth: (fieldId: number, days = 30) =>
    api.get(`/api/monitoring/plant-health/field/${fieldId}?days=${days}`),
  createPlantHealth: (healthData: any) =>
    api.post('/api/monitoring/plant-health', healthData),
  uploadPlantImage: (fieldId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/monitoring/plant-health/upload-image?field_id=${fieldId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getWeatherData: (fieldId: number, days = 7) =>
    api.get(`/api/monitoring/weather/field/${fieldId}?days=${days}`),
  createWeatherData: (weatherData: any) =>
    api.post('/api/monitoring/weather', weatherData),
  getSensorData: (fieldId: number, sensorType?: string, hours = 24) => {
    const params = new URLSearchParams();
    if (sensorType) params.append('sensor_type', sensorType);
    params.append('hours', hours.toString());
    return api.get(`/api/monitoring/sensors/field/${fieldId}?${params}`);
  },
  createSensorData: (sensorData: any) =>
    api.post('/api/monitoring/sensors', sensorData),
  getFieldAnalytics: (fieldId: number) =>
    api.get(`/api/monitoring/analytics/field/${fieldId}`),
};

export const chatAPI = {
  sendMessage: (messageData: any) => api.post('/api/chat/message', messageData),
  getSessions: () => api.get('/api/chat/sessions'),
  getSession: (sessionId: string) => api.get(`/api/chat/sessions/${sessionId}`),
  provideFeedback: (messageId: number, rating: number, comment?: string) =>
    api.post(`/api/chat/feedback/${messageId}`, { rating, comment }),
};

export const mlAPI = {
  classifyPlant: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/classify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  classifyPlantBase64: (imageData: string) =>
    api.post('/api/classify/base64', { image: imageData }),
  getTrainingStatus: () => api.get('/api/training/status'),
  startTraining: () => api.post('/api/training/start'),
  stopTraining: () => api.post('/api/training/stop'),
  getModels: () => api.get('/api/models'),
  loadModel: (modelName: string) => api.post(`/api/models/${modelName}/load`),
  getMetrics: () => api.get('/api/metrics'),
};

export default api; 