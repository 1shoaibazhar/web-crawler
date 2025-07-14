// Auth service for authentication operations

import { apiService, API_ENDPOINTS } from './api.service';
import { StorageService } from './storage.service';
import type { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  RefreshTokenResponse, 
  UserInfo,
  ChangePasswordRequest
} from '../types';

export class AuthService {
  private static instance: AuthService;
  private loginPromise: Promise<TokenResponse> | null = null;

  // Singleton pattern
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(credentials: LoginRequest): Promise<TokenResponse> {
    // Prevent multiple simultaneous login attempts
    if (this.loginPromise) {
      return this.loginPromise;
    }

    this.loginPromise = this.performLogin(credentials);
    
    try {
      const response = await this.loginPromise;
      this.loginPromise = null;
      return response;
    } catch (error) {
      this.loginPromise = null;
      throw error;
    }
  }

  private async performLogin(credentials: LoginRequest): Promise<TokenResponse> {
    try {
      const response = await apiService.post<TokenResponse>(API_ENDPOINTS.login, credentials);
      
      // Store tokens and user info
      if (response.access_token) {
        StorageService.setToken(response.access_token);
        console.log('Auth Service - Token stored in localStorage');
      }
      if (response.refresh_token) {
        StorageService.setRefreshToken(response.refresh_token);
      }
      if (response.user) {
        StorageService.setUser(response.user);
      }

      return response;
    } catch (error) {
      // Clear any stored auth data on login failure
      StorageService.clear();
      throw error;
    }
  }

  async register(data: RegisterRequest): Promise<TokenResponse> {
    try {
      const response = await apiService.post<TokenResponse>(API_ENDPOINTS.register, data);
      
      // Store tokens and user info after successful registration
      if (response.access_token) {
        StorageService.setToken(response.access_token);
      }
      if (response.refresh_token) {
        StorageService.setRefreshToken(response.refresh_token);
      }
      if (response.user) {
        StorageService.setUser(response.user);
      }

      return response;
    } catch (error) {
      // Clear any stored auth data on registration failure
      StorageService.clear();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = StorageService.getRefreshToken();
      if (refreshToken) {
        // Notify backend about logout
        await apiService.post(API_ENDPOINTS.logout, { refresh_token: refreshToken });
      }
    } catch (error) {
      // Log error but don't throw - logout should always succeed locally
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      StorageService.clear();
    }
  }

  async refreshToken(token?: string): Promise<RefreshTokenResponse> {
    const refreshToken = token || StorageService.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiService.post<RefreshTokenResponse>(
        API_ENDPOINTS.refreshToken, 
        { refresh_token: refreshToken }
      );

      // Update stored tokens
      if (response.access_token) {
        StorageService.setToken(response.access_token);
      }
      if (response.refresh_token) {
        StorageService.setRefreshToken(response.refresh_token);
      }

      return response;
    } catch (error) {
      // Clear tokens on refresh failure
      StorageService.clear();
      throw error;
    }
  }

  async getProfile(): Promise<UserInfo> {
    try {
      const profile = await apiService.get<UserInfo>(API_ENDPOINTS.profile);
      
      // Update stored user info
      StorageService.setUser(profile);
      
      return profile;
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(data: Partial<UserInfo>): Promise<UserInfo> {
    try {
      const updatedProfile = await apiService.put<UserInfo>(API_ENDPOINTS.updateProfile, data);
      
      // Update stored user info
      StorageService.setUser(updatedProfile);
      
      return updatedProfile;
    } catch (error) {
      throw error;
    }
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    try {
      await apiService.put<void>(API_ENDPOINTS.changePassword, data);
    } catch (error) {
      throw error;
    }
  }

  // Utility methods
  getCurrentUser(): UserInfo | null {
    return StorageService.getUser();
  }

  getCurrentToken(): string | null {
    const token = StorageService.getToken();
    if (token && !StorageService.isTokenExpired(token)) {
      return token;
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = StorageService.getToken();
    return token !== null && !StorageService.isTokenExpired(token);
  }

  isTokenExpired(): boolean {
    const token = StorageService.getToken();
    return token === null || StorageService.isTokenExpired(token);
  }

  getRemainingTokenTime(): number {
    const token = StorageService.getToken();
    return token ? StorageService.getRemainingTokenTime(token) : 0;
  }

  getTokenPayload(): any | null {
    const token = StorageService.getToken();
    return token ? StorageService.getTokenPayload(token) : null;
  }

  async validateToken(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      // Validate token by making a simple API call
      await this.getProfile();
      return true;
    } catch (error) {
      // Token might be invalid or expired
      StorageService.clear();
      return false;
    }
  }

  // Auto-refresh token if it's expiring soon
  async autoRefreshToken(): Promise<void> {
    const token = StorageService.getToken();
    if (!token) return;

    const remainingTime = StorageService.getRemainingTokenTime(token);
    const refreshThreshold = 5 * 60 * 1000; // 5 minutes

    if (remainingTime < refreshThreshold && remainingTime > 0) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        // Don't throw here - let the user continue but they'll need to login again
      }
    }
  }

  // Set up auto-refresh interval
  setupAutoRefresh(): () => void {
    const intervalId = setInterval(() => {
      this.autoRefreshToken();
    }, 60000); // Check every minute

    // Return cleanup function
    return () => clearInterval(intervalId);
  }

  // Reset password (if backend supports it)
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiService.post('/api/v1/auth/reset-password', { email });
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiService.post('/api/v1/auth/reset-password/confirm', {
        token,
        new_password: newPassword
      });
    } catch (error) {
      throw error;
    }
  }

  // Verify email (if backend supports it)
  async verifyEmail(token: string): Promise<void> {
    try {
      await apiService.post('/api/v1/auth/verify-email', { token });
    } catch (error) {
      throw error;
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      await apiService.post('/api/v1/auth/resend-verification');
    } catch (error) {
      throw error;
    }
  }
}

export const authService = AuthService.getInstance(); 