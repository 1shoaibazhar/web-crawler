// Common types used across the application

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  field: string;
  value: string;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith';
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface WebSocketMessage {
  type: 'progress_update' | 'results_update' | 'error';
  task_id?: number;
  progress?: number;
  message?: string;
  results?: any;
  error?: string;
} 