// API configuration for different environments
const getApiUrl = () => {
  // In development, use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // In production, use the Render backend API
  return 'https://errorcue.onrender.com';
};

export const API_URL = getApiUrl();
