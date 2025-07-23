import { environment, getFrontendUrl, getApiUrl } from '../config/environment';

// URL utility functions
export const urls = {
  // Frontend URLs
  home: () => getFrontendUrl('/'),
  dashboard: () => getFrontendUrl('/dashboard'),
  farms: () => getFrontendUrl('/farms'),
  monitoring: () => getFrontendUrl('/monitoring'),
  chat: () => getFrontendUrl('/chat'),
  analytics: () => getFrontendUrl('/analytics'),
  diseaseDetection: () => getFrontendUrl('/disease-detection'),
  learning: () => getFrontendUrl('/learning'),
  profile: () => getFrontendUrl('/profile'),
  admin: () => getFrontendUrl('/admin'),
  consultant: () => getFrontendUrl('/consultant'),
  
  // API URLs
  api: {
    auth: {
      login: () => getApiUrl('/api/auth/login'),
      register: () => getApiUrl('/api/auth/register'),
      profile: () => getApiUrl('/api/auth/me'),
    },
    farms: {
      list: () => getApiUrl('/api/farms'),
      detail: (id: number) => getApiUrl(`/api/farms/${id}`),
      create: () => getApiUrl('/api/farms'),
      update: (id: number) => getApiUrl(`/api/farms/${id}`),
      delete: (id: number) => getApiUrl(`/api/farms/${id}`),
    },
    weather: {
      forecast: () => getApiUrl('/api/weather/forecast'),
      current: () => getApiUrl('/api/weather/current'),
    },
    monitoring: {
      plantHealth: () => getApiUrl('/api/monitoring/plant-health'),
      weather: () => getApiUrl('/api/monitoring/weather'),
      sensors: () => getApiUrl('/api/monitoring/sensors'),
    },
  },
  
  // External URLs
  external: {
    documentation: 'https://docs.agmo-farm.com',
    support: 'https://support.agmo-farm.com',
    github: 'https://github.com/agmo-farm',
  },
} as const;

// Helper function to get the current page URL
export const getCurrentPageUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return environment.frontendUrl;
};

// Helper function to get the current page path
export const getCurrentPagePath = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  return '/';
};

// Helper function to check if we're on a specific page
export const isOnPage = (path: string) => {
  return getCurrentPagePath() === path;
};

export default urls; 