// Environment configuration
export const environment = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  
  // Frontend Configuration
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000',
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Feature flags
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableDebugMode: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  
  // External services
  weatherApiKey: import.meta.env.VITE_WEATHER_API_KEY,
  mapApiKey: import.meta.env.VITE_MAP_API_KEY,
  
  // Build info
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString(),
} as const;

// Helper functions
export const getApiUrl = (endpoint: string = '') => {
  return `${environment.apiUrl}${endpoint}`;
};

export const getFrontendUrl = (path: string = '') => {
  return `${environment.frontendUrl}${path}`;
};

export const isLocalhost = () => {
  return environment.frontendUrl.includes('localhost') || environment.frontendUrl.includes('127.0.0.1');
};

export default environment; 