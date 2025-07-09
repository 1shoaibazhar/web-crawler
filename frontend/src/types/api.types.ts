// API-related types for HTTP requests and responses

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
  code?: string;
}

export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers?: Record<string, string>;
}

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface ApiEndpoints {
  // Auth endpoints
  login: string;
  register: string;
  refreshToken: string;
  logout: string;
  profile: string;
  updateProfile: string;
  changePassword: string;
  
  // Crawl endpoints
  startCrawl: string;
  getTasks: string;
  getTaskStatus: (id: number) => string;
  stopCrawl: (id: number) => string;
  getResults: (id: number) => string;
  getLinks: (id: number) => string;
  deleteTask: (id: number) => string;
  bulkDelete: string;
  bulkRerun: string;
  
  // Statistics endpoints
  getStats: string;
  getUserStats: string;
  
  // WebSocket endpoint
  websocket: string;
  
  // Health endpoints
  health: string;
  version: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TasksQueryParams extends PaginationParams, SortParams, FilterParams {}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

export interface VersionResponse {
  version: string;
  build: string;
}

export interface BulkActionRequest {
  taskIds: number[];
}

export interface BulkActionResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors?: string[];
}

export interface StatsResponse {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalPages: number;
  totalLinks: number;
  averageResponseTime: number;
} 