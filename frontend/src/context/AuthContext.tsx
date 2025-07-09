import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authService, serviceEvents } from '../services';
import type { UserInfo, LoginRequest, RegisterRequest, AuthState, ChangePasswordRequest } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<UserInfo>) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;
  validateToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Update authentication state
  const updateAuthState = useCallback((
    updates: Partial<AuthState>
  ) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize authentication state
  const initializeAuth = useCallback(async () => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const token = authService.getCurrentToken();
      const user = authService.getCurrentUser();
      
      if (token && user) {
        // Validate token
        const isValid = await authService.validateToken();
        
        if (isValid) {
          updateAuthState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Set up auto-refresh
          authService.setupAutoRefresh();
          
          // Emit login event
          serviceEvents.emit('auth:login', { user });
        } else {
          // Token invalid, clear state
          updateAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        updateAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to initialize authentication',
      });
    }
  }, [updateAuthState]);

  // Login function
  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const response = await authService.login(credentials);
      
      updateAuthState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Set up auto-refresh
      authService.setupAutoRefresh();
      
      // Emit login event
      serviceEvents.emit('auth:login', { user: response.user });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      updateAuthState({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [updateAuthState]);

  // Register function
  const register = useCallback(async (data: RegisterRequest) => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const response = await authService.register(data);
      
      updateAuthState({
        user: response.user,
        token: response.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Set up auto-refresh
      authService.setupAutoRefresh();
      
      // Emit login event (after registration)
      serviceEvents.emit('auth:login', { user: response.user });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      updateAuthState({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [updateAuthState]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      // Call logout service
      await authService.logout();
      
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Emit logout event
      serviceEvents.emit('auth:logout');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear local state even if API call fails
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      
      // Emit logout event
      serviceEvents.emit('auth:logout');
    }
  }, [updateAuthState]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      updateAuthState({ error: null });
      
      const response = await authService.refreshToken();
      
      updateAuthState({
        token: response.access_token,
      });
      
      // Emit token refresh event
      serviceEvents.emit('auth:token-refresh');
      
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear auth state on refresh failure
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        error: 'Session expired. Please login again.',
      });
      
      // Emit logout event
      serviceEvents.emit('auth:logout', { reason: 'Token refresh failed' });
    }
  }, [updateAuthState]);

  // Update profile function
  const updateProfile = useCallback(async (data: Partial<UserInfo>) => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      const updatedUser = await authService.updateProfile(data);
      
      updateAuthState({
        user: updatedUser,
        isLoading: false,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      updateAuthState({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [updateAuthState]);

  // Change password function
  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      updateAuthState({ isLoading: true, error: null });
      
      await authService.changePassword(data);
      
      updateAuthState({
        isLoading: false,
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      updateAuthState({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [updateAuthState]);

  // Validate token function
  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      return await authService.validateToken();
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for service events
  useEffect(() => {
    const handleLogout = () => {
      updateAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        error: null,
      });
    };

    serviceEvents.on('auth:logout', handleLogout);
    
    return () => {
      serviceEvents.off('auth:logout', handleLogout);
    };
  }, [updateAuthState]);

  // Auto-refresh token when it's about to expire
  useEffect(() => {
    if (!state.isAuthenticated || !state.token) return;

    const checkAndRefreshToken = async () => {
      const remainingTime = authService.getRemainingTokenTime();
      const refreshThreshold = 5 * 60 * 1000; // 5 minutes

      if (remainingTime < refreshThreshold && remainingTime > 0) {
        try {
          await refreshToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }
    };

    const intervalId = setInterval(checkAndRefreshToken, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [state.isAuthenticated, state.token, refreshToken]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
    clearError,
    validateToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 