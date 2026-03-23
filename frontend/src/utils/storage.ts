/**
 * Local storage utility for authentication tokens
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';
const REMEMBER_ME_KEY = 'remember_me';

/**
 * Auth token storage operations
 */
export const tokenStorage = {
  /**
   * Save authentication token
   */
  setToken: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token:', error);
    }
  },

  /**
   * Get authentication token
   */
  getToken: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  },

  /**
   * Remove authentication token
   */
  removeToken: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!tokenStorage.getToken();
  },
};

/**
 * User info storage operations
 */
export const userStorage = {
  /**
   * Save user information
   */
  setUser: (user: { id: string; username: string; email: string }): void => {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user info:', error);
    }
  },

  /**
   * Get user information
   */
  getUser: (): { id: string; username: string; email: string } | null => {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Failed to get user info:', error);
      return null;
    }
  },

  /**
   * Remove user information
   */
  removeUser: (): void => {
    try {
      localStorage.removeItem(USER_KEY);
    } catch (error) {
      console.error('Failed to remove user info:', error);
    }
  },
};

/**
 * Remember me preference storage
 */
export const rememberMeStorage = {
  /**
   * Save remember me preference
   */
  set: (value: boolean): void => {
    try {
      localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save remember me preference:', error);
    }
  },

  /**
   * Get remember me preference
   */
  get: (): boolean => {
    try {
      const value = localStorage.getItem(REMEMBER_ME_KEY);
      return value ? JSON.parse(value) : false;
    } catch (error) {
      console.error('Failed to get remember me preference:', error);
      return false;
    }
  },

  /**
   * Remove remember me preference
   */
  remove: (): void => {
    try {
      localStorage.removeItem(REMEMBER_ME_KEY);
    } catch (error) {
      console.error('Failed to remove remember me preference:', error);
    }
  },
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  tokenStorage.removeToken();
  userStorage.removeUser();
  rememberMeStorage.remove();
};

export default {
  token: tokenStorage,
  user: userStorage,
  rememberMe: rememberMeStorage,
  clearAuthData,
};
