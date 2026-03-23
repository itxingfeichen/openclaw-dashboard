/**
 * Authentication API service
 */

import axios from 'axios';
import { tokenStorage, userStorage, clearAuthData } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Create axios instance for auth requests
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization header
authClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      clearAuthData();
      // Redirect to login will be handled by the calling component
    }
    return Promise.reject(error);
  }
);

/**
 * API Response types
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    timestamp: string;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LoginResponse {
  user: User;
  token: string;
  accessToken?: string;
  refreshToken?: string;
  message: string;
}

interface RegisterResponse {
  user: User;
  message: string;
}

/**
 * Authentication service
 */
export const authService = {
  /**
   * Login user with email and password
   * @param credentials - Login credentials
   * @returns Login response with user info and token
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await authClient.post<ApiResponse<LoginResponse>>(
        '/auth/login',
        credentials
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Login failed');
      }

      const { user, token, accessToken, refreshToken, message } = response.data.data;

      // Store token and user info (prefer accessToken, fallback to token for backwards compatibility)
      const authToken = accessToken || token;
      if (authToken) {
        tokenStorage.setToken(authToken);
      }
      // Optionally store refresh token for token refresh functionality
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      userStorage.setUser(user);

      return { user, token: authToken, message };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error?.message ||
            error.message ||
            'Login failed. Please check your credentials.'
        );
      }
      throw error;
    }
  },

  /**
   * Register a new user
   * @param userData - Registration data
   * @returns Registration response with user info
   */
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await authClient.post<ApiResponse<RegisterResponse>>(
        '/auth/register',
        userData
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error?.message || 'Registration failed');
      }

      const { user, message } = response.data.data;

      return { user, message };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error?.message ||
            error.message ||
            'Registration failed. Please try again.'
        );
      }
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      await authClient.post<ApiResponse<void>>('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, clearing local data anyway:', error);
    } finally {
      // Always clear local auth data
      clearAuthData();
    }
  },

  /**
   * Get current authenticated user
   * @returns Current user info or null if not authenticated
   */
  getCurrentUser: (): User | null => {
    return userStorage.getUser();
  },

  /**
   * Check if user is authenticated
   * @returns true if user has a valid token
   */
  isAuthenticated: (): boolean => {
    return tokenStorage.isAuthenticated();
  },

  /**
   * Get authentication token
   * @returns Token string or null
   */
  getToken: (): string | null => {
    return tokenStorage.getToken();
  },
};

export default authService;
