import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Types
interface User {
  id: string;
  email: string;
  createdAt: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
const API_BASE_URL = import.meta.env.PROD 
  ? window.location.origin  // Use same domain in production
  : 'http://localhost:3001'; // Use localhost in development

console.log('Auth Context - Environment:', {
  PROD: import.meta.env.PROD,
  DEV: import.meta.env.DEV,
  MODE: import.meta.env.MODE,
  API_BASE_URL: API_BASE_URL,
  origin: window.location.origin
});

axios.defaults.baseURL = API_BASE_URL;

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor to include token in requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem('errorCueToken');
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check for existing token on app start
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('errorCueToken');
      
      if (storedToken) {
        try {
          // Verify token with backend
          const response = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          
          setToken(storedToken);
          setUser(response.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('errorCueToken');
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('errorCueToken', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.error || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/signup', { email, password });
      const { token: newToken, user: userData } = response.data;

      localStorage.setItem('errorCueToken', newToken);
      setToken(newToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data?.error || 'Signup failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('errorCueToken');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    isAuthenticated,
    user,
    token,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export context for use in custom hook
export { AuthContext };
