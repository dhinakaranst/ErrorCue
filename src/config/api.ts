// API configuration for different environments
const getApiUrl = () => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // In production, use the same domain (no port needed for Render)
  return window.location.origin;
};

export const API_URL = getApiUrl();
