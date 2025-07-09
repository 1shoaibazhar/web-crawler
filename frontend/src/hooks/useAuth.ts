import { useContext, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { authService, serviceEvents } from '../services';
import type { AuthHookResult, LoginRequest, RegisterRequest } from '../types';

export const useAuth = (): AuthHookResult => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  // Enhanced login with navigation
  const loginWithRedirect = useCallback(async (
    credentials: LoginRequest,
    redirectTo: string = '/dashboard'
  ) => {
    try {
      await context.login(credentials);
      navigate(redirectTo);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  }, [context, navigate]);

  // Enhanced register with navigation
  const registerWithRedirect = useCallback(async (
    data: RegisterRequest,
    redirectTo: string = '/dashboard'
  ) => {
    try {
      await context.register(data);
      navigate(redirectTo);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  }, [context, navigate]);

  // Enhanced logout with navigation
  const logoutWithRedirect = useCallback(async (redirectTo: string = '/login') => {
    try {
      await context.logout();
      navigate(redirectTo);
    } catch (error) {
      console.error('Logout error:', error);
      // Always navigate even if logout fails
      navigate(redirectTo);
    }
  }, [context, navigate]);

  // Check if user has specific role/permission
  const hasRole = useCallback((role: string): boolean => {
    if (!context.user) return false;
    // This would depend on your user model structure
    return (context.user as any).role === role;
  }, [context.user]);

  // Check if user is admin
  const isAdmin = useCallback((): boolean => {
    return hasRole('admin');
  }, [hasRole]);

  // Get user display name
  const getUserDisplayName = useCallback((): string => {
    if (!context.user) return '';
    return context.user.username || context.user.email || 'User';
  }, [context.user]);

  // Check if token is about to expire
  const isTokenExpiring = useCallback((): boolean => {
    if (!context.token) return false;
    const remainingTime = authService.getRemainingTokenTime();
    const expirationThreshold = 10 * 60 * 1000; // 10 minutes
    return remainingTime < expirationThreshold;
  }, [context.token]);

  // Get time until token expires
  const getTokenExpiresIn = useCallback((): number => {
    if (!context.token) return 0;
    return authService.getRemainingTokenTime();
  }, [context.token]);

  // Force refresh token
  const forceRefreshToken = useCallback(async (): Promise<void> => {
    try {
      await context.refreshToken();
    } catch (error) {
      console.error('Force refresh failed:', error);
      throw error;
    }
  }, [context]);

  // Check authentication status
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    if (!context.isAuthenticated) return false;
    return await context.validateToken();
  }, [context]);

  // Clear authentication errors
  const clearAuthError = useCallback(() => {
    setAuthError(null);
    context.clearError();
  }, [context]);

  // Listen for authentication events
  useEffect(() => {
    const handleAuthError = (data: any) => {
      setAuthError(data.message || 'Authentication error');
    };

    const handleLogout = (data: any) => {
      setAuthError(null);
      if (data?.reason === 'Token refresh failed') {
        setAuthError('Session expired. Please login again.');
      }
    };

    serviceEvents.on('api:error', handleAuthError);
    serviceEvents.on('auth:logout', handleLogout);

    return () => {
      serviceEvents.off('api:error', handleAuthError);
      serviceEvents.off('auth:logout', handleLogout);
    };
  }, []);

  // Auto-clear auth errors after 5 seconds
  useEffect(() => {
    if (authError) {
      const timer = setTimeout(() => {
        setAuthError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  return {
    // Core auth state
    user: context.user,
    token: context.token,
    isLoading: context.isLoading,
    isAuthenticated: context.isAuthenticated,
    error: context.error || authError,

    // Core auth functions
    login: context.login,
    register: context.register,
    logout: context.logout,
    refreshToken: context.refreshToken,
    updateProfile: context.updateProfile,
    changePassword: context.changePassword,
    clearError: clearAuthError,

    // Enhanced functions with navigation
    loginWithRedirect,
    registerWithRedirect,
    logoutWithRedirect,

    // Utility functions
    hasRole,
    isAdmin,
    getUserDisplayName,
    isTokenExpiring,
    getTokenExpiresIn,
    forceRefreshToken,
    checkAuthStatus,
  };
};

// Hook for checking authentication status on route changes
export const useAuthCheck = () => {
  const { isAuthenticated, checkAuthStatus } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const performAuthCheck = useCallback(async () => {
    if (!isAuthenticated) return false;
    
    setIsChecking(true);
    try {
      const isValid = await checkAuthStatus();
      return isValid;
    } finally {
      setIsChecking(false);
    }
  }, [isAuthenticated, checkAuthStatus]);

  useEffect(() => {
    if (isAuthenticated) {
      performAuthCheck();
    }
  }, [isAuthenticated, performAuthCheck]);

  return { isChecking, performAuthCheck };
};

// Hook for protected routes
export const useProtectedRoute = (requiredRole?: string) => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      if (requiredRole && !hasRole(requiredRole)) {
        navigate('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, hasRole, requiredRole, navigate]);

  return {
    isAuthenticated,
    isLoading,
    user,
    hasAccess: isAuthenticated && (!requiredRole || hasRole(requiredRole)),
  };
};

// Hook for login/register forms
export const useAuthForm = () => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = useCallback(async (credentials: LoginRequest) => {
    try {
      clearError();
      setFormError(null);
      await login(credentials);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setFormError(errorMessage);
      throw error;
    }
  }, [login, clearError]);

  const handleRegister = useCallback(async (data: RegisterRequest) => {
    try {
      clearError();
      setFormError(null);
      await register(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setFormError(errorMessage);
      throw error;
    }
  }, [register, clearError]);

  const clearFormError = useCallback(() => {
    setFormError(null);
    clearError();
  }, [clearError]);

  return {
    handleLogin,
    handleRegister,
    isLoading,
    error: error || formError,
    clearError: clearFormError,
  };
};

export default useAuth; 