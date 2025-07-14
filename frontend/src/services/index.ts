// Export all services for easy importing

// Core services
export { ApiService, apiService, API_ENDPOINTS, DEFAULT_API_CONFIG } from './api.service';
export { AuthService, authService } from './auth.service';
export { CrawlService, crawlService } from './crawl.service';
export { StorageService } from './storage.service';
export { WebSocketService, webSocketService } from './websocket.service';
export { serviceEvents, type ServiceEvent } from './event-emitter';

// Import services for internal use
import { apiService } from './api.service';
import { authService } from './auth.service';
import { crawlService } from './crawl.service';
import { StorageService } from './storage.service';
import { webSocketService } from './websocket.service';
import { serviceEvents } from './event-emitter';

// Re-export types for convenience
export type { ApiError, ApiConfig, ApiEndpoints } from '../types/api.types';
export type { 
  LoginRequest, 
  RegisterRequest, 
  TokenResponse, 
  UserInfo,
  ChangePasswordRequest,
  AuthState,
  AuthHookResult 
} from '../types/auth.types';
export type { 
  CrawlTask, 
  CrawlResult, 
  CrawlLink, 
  StartCrawlRequest,
  TaskStatus,
  TaskStatusResponse,
  CrawlTasksResponse 
} from '../types/crawl.types';
export type { WebSocketMessage } from '../types/api.types';

// Service configuration
export const SERVICES_CONFIG = {
  API: {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
  WEBSOCKET: {
    URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
  },
  AUTH: {
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
    AUTO_REFRESH_INTERVAL: 60000, // 1 minute
  },
  CRAWL: {
    POLL_INTERVAL: 5000, // 5 seconds
    BATCH_SIZE: 5,
    MAX_DEPTH: 50,
    MAX_PAGES: 10000,
  },
} as const;

// Service utilities
export const ServiceUtils = {
  isServiceAvailable: async (serviceName: string): Promise<boolean> => {
    try {
      switch (serviceName) {
        case 'api':
          await apiService.healthCheck();
          return true;
        case 'auth':
          return authService.isAuthenticated();
        case 'websocket':
          return webSocketService !== null;
        default:
          return false;
      }
    } catch {
      return false;
    }
  },

  getServiceStatus: async (): Promise<{
    api: boolean;
    auth: boolean;
    websocket: boolean;
  }> => {
    const [api, auth, websocket] = await Promise.all([
      ServiceUtils.isServiceAvailable('api'),
      ServiceUtils.isServiceAvailable('auth'),
      ServiceUtils.isServiceAvailable('websocket'),
    ]);

    return { api, auth, websocket };
  },

  initializeServices: async (): Promise<void> => {
    try {
      // Initialize WebSocket connection if user is authenticated
      if (authService.isAuthenticated()) {
        webSocketService.connect();
      }

      // Set up auto-refresh for auth tokens
      authService.setupAutoRefresh();
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  },

  cleanupServices: (): void => {
    try {
      // Disconnect WebSocket
      webSocketService.disconnect();
      
      // Clear any storage data
      StorageService.clear();
    } catch (error) {
      console.error('Failed to cleanup services:', error);
    }
  },
};

// Export service instances for direct access
export const services = {
  api: apiService,
  auth: authService,
  crawl: crawlService,
  storage: StorageService,
  websocket: webSocketService,
} as const;



// Service health checker
export class ServiceHealthChecker {
  private static instance: ServiceHealthChecker;
  private intervalId: NodeJS.Timeout | null = null;

  static getInstance(): ServiceHealthChecker {
    if (!ServiceHealthChecker.instance) {
      ServiceHealthChecker.instance = new ServiceHealthChecker();
    }
    return ServiceHealthChecker.instance;
  }

  startHealthChecks(interval: number = 30000): void {
    this.stopHealthChecks();
    
    this.intervalId = setInterval(async () => {
      const status = await ServiceUtils.getServiceStatus();
      
      if (!status.api) {
        serviceEvents.emit('api:error', { message: 'API service unavailable' });
      }
      
      if (!status.auth && authService.isAuthenticated()) {
        serviceEvents.emit('auth:logout', { reason: 'Authentication lost' });
      }
      
      if (!status.websocket && authService.isAuthenticated()) {
        // Try to reconnect WebSocket
        webSocketService.connect();
      }
    }, interval);
  }

  stopHealthChecks(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const serviceHealthChecker = ServiceHealthChecker.getInstance(); 