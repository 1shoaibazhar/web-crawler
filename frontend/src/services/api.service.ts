// Base API service with axios configuration and interceptors

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { ApiConfig, ApiError, ApiEndpoints } from '../types';
import { StorageService } from './storage.service';

export class ApiService {
  private client: AxiosInstance;

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
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        const apiError: ApiError = {
          error: error.response?.data?.error || 'Network error',
          message: error.response?.data?.message || error.message,
          status: error.response?.status,
        };

        // Handle 401 errors (token expired)
        if (error.response?.status === 401) {
          StorageService.clear();
          window.location.href = '/login';
        }

        return Promise.reject(apiError);
      }
    );
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
}

// API endpoints configuration
export const API_ENDPOINTS: ApiEndpoints = {
  // Auth endpoints
  login: '/api/v1/auth/login',
  register: '/api/v1/auth/register',
  refreshToken: '/api/v1/auth/refresh',
  profile: '/api/v1/user/profile',
  updateProfile: '/api/v1/user/profile',
  
  // Crawl endpoints
  startCrawl: '/api/v1/crawl',
  getTasks: '/api/v1/crawl',
  getTaskStatus: (id: number) => `/api/v1/crawl/${id}`,
  stopCrawl: (id: number) => `/api/v1/crawl/${id}/stop`,
  getResults: (id: number) => `/api/v1/crawl/${id}/results`,
  deleteTask: (id: number) => `/api/v1/crawl/${id}`,
  
  // WebSocket endpoint
  websocket: '/ws',
};

// Default API configuration
export const DEFAULT_API_CONFIG: ApiConfig = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
};

// Create default API instance
export const apiService = new ApiService(DEFAULT_API_CONFIG); 