// Service event types
export type ServiceEvent = 
  | 'auth:login'
  | 'auth:logout'
  | 'auth:token-refresh'
  | 'crawl:started'
  | 'crawl:completed'
  | 'crawl:failed'
  | 'crawl:progress'
  | 'websocket:connected'
  | 'websocket:disconnected'
  | 'websocket:message'
  | 'api:error';

// Service event emitter
class ServiceEventEmitter {
  private listeners: { [key: string]: Function[] } = {};

  on(event: ServiceEvent, callback: Function): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event: ServiceEvent, callback: Function): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  emit(event: ServiceEvent, data?: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

export const serviceEvents = new ServiceEventEmitter(); 