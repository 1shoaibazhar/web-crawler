// WebSocket service for real-time updates

import type { WebSocketMessage, WebSocketConfig, WebSocketEventMap } from '../types';
import { serviceEvents } from './index';
import { StorageService } from './storage.service';

export interface WebSocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  lastConnected: Date | null;
  connectionAttempts: number;
  error: string | null;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private listeners: { [key: string]: Function[] } = {};
  private url: string;
  private config: WebSocketConfig;
  private connectionState: WebSocketConnectionState;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private isAuthenticated = false;
  private authToken: string | null = null;

  constructor(config: WebSocketConfig) {
    this.url = config.url;
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      heartbeatInterval: 30000,
      ...config,
    };
    
    this.connectionState = {
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      lastConnected: null,
      connectionAttempts: 0,
      error: null,
    };

    // Listen for authentication events
    this.setupAuthListener();
  }

  private setupAuthListener(): void {
    serviceEvents.on('auth:login', () => {
      this.authToken = StorageService.getToken();
      this.isAuthenticated = true;
      this.connect();
    });

    serviceEvents.on('auth:logout', () => {
      this.authToken = null;
      this.isAuthenticated = false;
      this.disconnect();
    });

    serviceEvents.on('auth:token-refresh', () => {
      this.authToken = StorageService.getToken();
      // Reconnect with new token if currently connected
      if (this.connectionState.isConnected) {
        this.reconnect();
      }
    });
  }

  public getConnectionState(): WebSocketConnectionState {
    return { ...this.connectionState };
  }

  public isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  public connect(): void {
    if (this.connectionState.isConnecting || this.connectionState.isConnected) {
      return;
    }

    // Check if we have authentication token
    if (!this.authToken) {
      this.authToken = StorageService.getToken();
    }

    if (!this.authToken) {
      console.log('WebSocket: No authentication token available');
      return;
    }

    this.updateConnectionState({ isConnecting: true, error: null });

    try {
      // Add authentication token to WebSocket URL
      const wsUrl = new URL(this.url);
      wsUrl.searchParams.set('token', this.authToken);
      
      this.ws = new WebSocket(wsUrl.toString());
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

      // Set connection timeout
      setTimeout(() => {
        if (this.connectionState.isConnecting) {
          this.handleConnectionTimeout();
        }
      }, 10000);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.updateConnectionState({
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      });
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    console.log('WebSocket connected successfully');
    
    this.updateConnectionState({
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      lastConnected: new Date(),
      connectionAttempts: 0,
      error: null,
    });

    this.reconnectAttempts = 0;
    this.startHeartbeat();
    this.resubscribeAll();
    this.emit('connect');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle different message types
      this.handleWebSocketMessage(message);
      
      // Emit generic message event
      this.emit('message', message);
      
      // Emit specific message type events
      if (message.type) {
        this.emit(message.type, message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
      this.emit('error', { type: 'parse_error', error });
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'crawl_progress':
        this.handleCrawlProgress(message);
        break;
      case 'crawl_started':
        this.handleCrawlStarted(message);
        break;
      case 'crawl_completed':
        this.handleCrawlCompleted(message);
        break;
      case 'crawl_failed':
        this.handleCrawlFailed(message);
        break;
      case 'crawl_stopped':
        this.handleCrawlStopped(message);
        break;
      case 'heartbeat':
        this.handleHeartbeat(message);
        break;
      case 'error':
        this.handleServerError(message);
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }

  private handleCrawlProgress(message: WebSocketMessage): void {
    const progress = message.data as any;
    // Emit through internal event system
    this.emit('crawl_progress', progress);
  }

  private handleCrawlStarted(message: WebSocketMessage): void {
    const task = message.data as any;
    this.emit('crawl_started', task);
  }

  private handleCrawlCompleted(message: WebSocketMessage): void {
    const task = message.data as any;
    this.emit('crawl_completed', task);
  }

  private handleCrawlFailed(message: WebSocketMessage): void {
    const { task, error } = message.data as { task: any; error: string };
    this.emit('crawl_failed', { task, error });
  }

  private handleCrawlStopped(message: WebSocketMessage): void {
    const task = message.data as any;
    this.emit('crawl_stopped', task);
  }

  private handleHeartbeat(_message: WebSocketMessage): void {
    // Respond to heartbeat
    this.send({ type: 'heartbeat_response', timestamp: Date.now() });
  }

  private handleServerError(message: WebSocketMessage): void {
    const error = message.data as { code: string; message: string };
    console.error('WebSocket server error:', error);
    this.emit('error', error);
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    
    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      error: event.reason || 'Connection closed',
    });

    this.stopHeartbeat();
    this.emit('disconnect', { code: event.code, reason: event.reason });

    // Attempt to reconnect unless it was a clean close
    if (event.code !== 1000 && this.isAuthenticated) {
      this.scheduleReconnect();
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    
    this.updateConnectionState({
      error: 'Connection error',
    });

    this.emit('error', error);
  }

  private handleConnectionTimeout(): void {
    console.warn('WebSocket connection timeout');
    
    this.updateConnectionState({
      isConnecting: false,
      error: 'Connection timeout',
    });

    if (this.ws) {
      this.ws.close();
    }

    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.updateConnectionState({
        error: 'Max reconnection attempts reached',
      });
      return;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    this.reconnectAttempts++;
    this.updateConnectionState({
      isReconnecting: true,
      connectionAttempts: this.reconnectAttempts,
    });

    console.log(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private updateConnectionState(updates: Partial<WebSocketConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.emit('state-change', this.connectionState);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState.isConnected) {
        this.send({ type: 'heartbeat', timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private resubscribeAll(): void {
    this.subscriptions.forEach(subscription => {
      this.send({ type: 'subscribe', subscription });
    });
  }

  public reconnect(): void {
    this.disconnect();
    setTimeout(() => this.connect(), 100);
  }

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
    });

    this.reconnectAttempts = 0;
  }

  public send(message: any): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  // Subscription methods for specific crawl tasks
  public subscribeToCrawlTask(taskId: number): void {
    const subscription = `crawl_task:${taskId}`;
    this.subscriptions.add(subscription);
    
    if (this.connectionState.isConnected) {
      this.send({ type: 'subscribe', subscription });
    }
  }

  public unsubscribeFromCrawlTask(taskId: number): void {
    const subscription = `crawl_task:${taskId}`;
    this.subscriptions.delete(subscription);
    
    if (this.connectionState.isConnected) {
      this.send({ type: 'unsubscribe', subscription });
    }
  }

  public subscribeToAllCrawlTasks(): void {
    const subscription = 'crawl_tasks:all';
    this.subscriptions.add(subscription);
    
    if (this.connectionState.isConnected) {
      this.send({ type: 'subscribe', subscription });
    }
  }

  public unsubscribeFromAllCrawlTasks(): void {
    const subscription = 'crawl_tasks:all';
    this.subscriptions.delete(subscription);
    
    if (this.connectionState.isConnected) {
      this.send({ type: 'unsubscribe', subscription });
    }
  }

  // Event listener methods
  public on<K extends keyof WebSocketEventMap>(
    event: K,
    callback: (data: WebSocketEventMap[K]) => void
  ): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  public off<K extends keyof WebSocketEventMap>(
    event: K,
    callback?: (data: WebSocketEventMap[K]) => void
  ): void {
    if (!this.listeners[event]) return;
    
    if (callback) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    } else {
      delete this.listeners[event];
    }
  }

  public once<K extends keyof WebSocketEventMap>(
    event: K,
    callback: (data: WebSocketEventMap[K]) => void
  ): void {
    const onceWrapper = (data: WebSocketEventMap[K]) => {
      callback(data);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }

  private emit<K extends keyof WebSocketEventMap>(
    event: K,
    data?: WebSocketEventMap[K]
  ): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  public clearSubscriptions(): void {
    this.subscriptions.clear();
  }

  public destroy(): void {
    this.disconnect();
    this.listeners = {};
    this.subscriptions.clear();
    
    // Clean up service event listeners
    serviceEvents.off('auth:login', this.setupAuthListener);
    serviceEvents.off('auth:logout', this.setupAuthListener);
    serviceEvents.off('auth:token-refresh', this.setupAuthListener);
  }
}

// Configuration and service instance
const wsConfig: WebSocketConfig = {
  url: `${import.meta.env.VITE_WS_URL || 'ws://localhost:8080'}/ws`,
  reconnectAttempts: 5,
  reconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatInterval: 30000,
};

export const webSocketService = new WebSocketService(wsConfig);

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    webSocketService.destroy();
  });
} 