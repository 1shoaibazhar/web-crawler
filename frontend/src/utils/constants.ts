// Application constants and configuration

export const APP_CONFIG = {
  name: 'Web Crawler',
  version: '1.0.0',
  description: 'A web crawler application for analyzing web pages',
};

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 30000,
  retryAttempts: 3,
};

export const WS_CONFIG = {
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
  reconnectAttempts: 5,
  reconnectDelay: 1000,
};

export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  crawlDetails: '/crawl/:id',
  profile: '/profile',
} as const;

export const STORAGE_KEYS = {
  token: 'auth_token',
  user: 'auth_user',
  preferences: 'user_preferences',
} as const;

export const TASK_STATUS = {
  pending: 'pending',
  inProgress: 'in_progress', 
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
} as const;

export const LINK_TYPES = {
  internal: 'internal',
  external: 'external',
} as const;

export const TABLE_CONFIG = {
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 25, 50, 100],
  maxPageSizeForMobile: 5,
};

export const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  gray: '#6b7280',
  internal: '#10b981',
  external: '#3b82f6',
  inaccessible: '#ef4444',
}; 