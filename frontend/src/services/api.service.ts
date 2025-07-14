// Base API service with axios configuration and interceptors

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import type { ApiConfig, ApiError, ApiEndpoints } from '../types';
import { StorageService } from './storage.service';
import { retry } from '../utils';

export class ApiService {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{ resolve: Function; reject: Function }> = [];

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = StorageService.getToken();
        if (token && !StorageService.isTokenExpired(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(this.handleError(error))
    );

    // Response interceptor to handle errors and token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers!.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            this.processQueue(null, newToken);
            originalRequest.headers!.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.logout();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async refreshToken(): Promise<string> {
    try {
      const refreshToken = StorageService.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${this.client.defaults.baseURL}${API_ENDPOINTS.refreshToken}`, {
        refresh_token: refreshToken
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;
      StorageService.setToken(access_token);
      if (newRefreshToken) {
        StorageService.setRefreshToken(newRefreshToken);
      }

      return access_token;
    } catch (error) {
      StorageService.clear();
      throw error;
    }
  }

  private processQueue(error: any, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  private logout(): void {
    StorageService.clear();
    window.location.href = '/login';
  }

  private handleError(error: AxiosError): ApiError {
    const responseData = error.response?.data as any;
    const apiError: ApiError = {
      error: responseData?.error || error.name || 'Network error',
      message: responseData?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status,
      code: error.code,
    };

    // Log error for debugging
    console.error('API Error:', apiError);

    return apiError;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  // Retry wrapper for important requests
  async getWithRetry<T>(url: string, config?: AxiosRequestConfig, retries = 3): Promise<T> {
    return retry(() => this.get<T>(url, config), retries, 1000);
  }

  async postWithRetry<T>(url: string, data?: any, config?: AxiosRequestConfig, retries = 3): Promise<T> {
    return retry(() => this.post<T>(url, data, config), retries, 1000);
  }

  // Upload file with progress tracking
  async uploadFile<T>(
    url: string, 
    file: File, 
    onProgress?: (progress: number) => void,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<T>(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  // Download file
  async downloadFile(url: string, filename?: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.client.get(url, {
      ...config,
      responseType: 'blob',
    });

    // Trigger download if filename provided
    if (filename) {
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }

    return response.data;
  }

  // Bulk export with POST request and blob response
  async bulkExport(url: string, data: any, filename: string): Promise<Blob> {
    const response = await this.client.post(url, data, {
      responseType: 'blob',
    });

    // Trigger download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return blob;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }

  // Get API version
  async getVersion(): Promise<{ version: string; build: string }> {
    return this.get('/version');
  }
}

// API endpoints configuration
export const API_ENDPOINTS: ApiEndpoints = {
  // Auth endpoints
  login: '/api/v1/auth/login',
  register: '/api/v1/auth/register',
  refreshToken: '/api/v1/auth/refresh',
  logout: '/api/v1/auth/logout',
  profile: '/api/v1/user/profile',
  updateProfile: '/api/v1/user/profile',
  changePassword: '/api/v1/user/password',
  
  // Crawl endpoints
  startCrawl: '/api/v1/crawl',
  getTasks: '/api/v1/crawl',
  getTaskStatus: (id: number) => `/api/v1/crawl/${id}`,
  stopCrawl: (id: number) => `/api/v1/crawl/${id}/stop`,
  getResults: (id: number) => `/api/v1/crawl/${id}/results`,
  getLinks: (id: number) => `/api/v1/crawl/${id}/links`,
  deleteTask: (id: number) => `/api/v1/crawl/${id}`,
  bulkDelete: '/api/v1/crawl/bulk-delete',
  bulkRerun: '/api/v1/crawl/bulk-rerun',
  bulkStop: '/api/v1/crawl/bulk-stop',
  bulkExport: '/api/v1/crawl/bulk-export',
  
  // Statistics endpoints
  getStats: '/api/v1/stats',
  getUserStats: '/api/v1/stats/user',
  
  // WebSocket endpoint
  websocket: '/ws',
  
  // Health endpoints
  health: '/health',
  version: '/version',
};

// Default API configuration
export const DEFAULT_API_CONFIG: ApiConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
};

// Create default API instance
export const apiService = new ApiService(DEFAULT_API_CONFIG); 