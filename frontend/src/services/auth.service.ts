// Auth service for authentication operations

import { apiService, API_ENDPOINTS } from './api.service';
import type { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  RefreshTokenResponse, 
  UserInfo 
} from '../types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    return apiService.post<TokenResponse>(API_ENDPOINTS.login, credentials);
  }

  async register(data: RegisterRequest): Promise<TokenResponse> {
    return apiService.post<TokenResponse>(API_ENDPOINTS.register, data);
  }

  async refreshToken(token: string): Promise<RefreshTokenResponse> {
    return apiService.post<RefreshTokenResponse>(API_ENDPOINTS.refreshToken, { token });
  }

  async getProfile(): Promise<UserInfo> {
    return apiService.get<UserInfo>(API_ENDPOINTS.profile);
  }

  async updateProfile(data: Partial<UserInfo>): Promise<UserInfo> {
    return apiService.put<UserInfo>(API_ENDPOINTS.updateProfile, data);
  }
}

export const authService = new AuthService(); 