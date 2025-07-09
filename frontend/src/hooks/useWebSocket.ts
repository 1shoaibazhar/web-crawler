import { useState, useEffect, useCallback, useRef } from 'react';
import { webSocketService } from '../services/websocket.service';
import type { WebSocketConnectionState } from '../services/websocket.service';
import { useAuth } from './useAuth';

export interface WebSocketHookResult {
  connectionState: WebSocketConnectionState;
  isConnected: boolean;
  isConnecting: boolean;
  isReconnecting: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  send: (message: any) => boolean;
  subscribe: (event: string, callback: (data: any) => void) => void;
  unsubscribe: (event: string, callback?: (data: any) => void) => void;
  subscribeToCrawlTask: (taskId: number) => void;
  unsubscribeFromCrawlTask: (taskId: number) => void;
  subscribeToAllCrawlTasks: () => void;
  unsubscribeFromAllCrawlTasks: () => void;
}

export const useWebSocket = (): WebSocketHookResult => {
  const { isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<WebSocketConnectionState>(
    webSocketService.getConnectionState()
  );
  
  const callbacksRef = useRef<{ [key: string]: (data: any) => void }>({});

  // Update connection state when it changes
  useEffect(() => {
    const handleStateChange = (newState: WebSocketConnectionState) => {
      setConnectionState(newState);
    };

    webSocketService.on('state-change', handleStateChange);

    return () => {
      webSocketService.off('state-change', handleStateChange);
    };
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && !connectionState.isConnected && !connectionState.isConnecting) {
      webSocketService.connect();
    }
  }, [isAuthenticated, connectionState.isConnected, connectionState.isConnecting]);

  // Connect function
  const connect = useCallback(() => {
    webSocketService.connect();
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
  }, []);

  // Reconnect function
  const reconnect = useCallback(() => {
    webSocketService.reconnect();
  }, []);

  // Send message function
  const send = useCallback((message: any) => {
    return webSocketService.send(message);
  }, []);

  // Subscribe to events
  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    callbacksRef.current[event] = callback;
    webSocketService.on(event as any, callback);
  }, []);

  // Unsubscribe from events
  const unsubscribe = useCallback((event: string, callback?: (data: any) => void) => {
    if (callback) {
      webSocketService.off(event as any, callback);
    } else {
      const storedCallback = callbacksRef.current[event];
      if (storedCallback) {
        webSocketService.off(event as any, storedCallback);
        delete callbacksRef.current[event];
      }
    }
  }, []);

  // Subscribe to specific crawl task
  const subscribeToCrawlTask = useCallback((taskId: number) => {
    webSocketService.subscribeToCrawlTask(taskId);
  }, []);

  // Unsubscribe from specific crawl task
  const unsubscribeFromCrawlTask = useCallback((taskId: number) => {
    webSocketService.unsubscribeFromCrawlTask(taskId);
  }, []);

  // Subscribe to all crawl tasks
  const subscribeToAllCrawlTasks = useCallback(() => {
    webSocketService.subscribeToAllCrawlTasks();
  }, []);

  // Unsubscribe from all crawl tasks
  const unsubscribeFromAllCrawlTasks = useCallback(() => {
    webSocketService.unsubscribeFromAllCrawlTasks();
  }, []);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      Object.keys(callbacksRef.current).forEach(event => {
        const callback = callbacksRef.current[event];
        if (callback) {
          webSocketService.off(event as any, callback);
        }
      });
      callbacksRef.current = {};
    };
  }, []);

  return {
    connectionState,
    isConnected: connectionState.isConnected,
    isConnecting: connectionState.isConnecting,
    isReconnecting: connectionState.isReconnecting,
    error: connectionState.error,
    connect,
    disconnect,
    reconnect,
    send,
    subscribe,
    unsubscribe,
    subscribeToCrawlTask,
    unsubscribeFromCrawlTask,
    subscribeToAllCrawlTasks,
    unsubscribeFromAllCrawlTasks,
  };
};

// Hook for listening to specific crawl task progress
export const useCrawlProgress = (taskId?: number) => {
  const { subscribe, unsubscribe, subscribeToCrawlTask, unsubscribeFromCrawlTask } = useWebSocket();
  const [progress, setProgress] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (taskId) {
      subscribeToCrawlTask(taskId);
    }

    const handleProgress = (data: any) => {
      if (!taskId || data.task_id === taskId) {
        setProgress(data);
        setIsRunning(data.status === 'running');
      }
    };

    const handleStarted = (data: any) => {
      if (!taskId || data.id === taskId) {
        setIsRunning(true);
        setError(null);
      }
    };

    const handleCompleted = (data: any) => {
      if (!taskId || data.id === taskId) {
        setIsRunning(false);
        setError(null);
      }
    };

    const handleFailed = (data: any) => {
      if (!taskId || data.task.id === taskId) {
        setIsRunning(false);
        setError(data.error);
      }
    };

    const handleStopped = (data: any) => {
      if (!taskId || data.id === taskId) {
        setIsRunning(false);
      }
    };

    subscribe('crawl_progress', handleProgress);
    subscribe('crawl_started', handleStarted);
    subscribe('crawl_completed', handleCompleted);
    subscribe('crawl_failed', handleFailed);
    subscribe('crawl_stopped', handleStopped);

    return () => {
      if (taskId) {
        unsubscribeFromCrawlTask(taskId);
      }
      unsubscribe('crawl_progress', handleProgress);
      unsubscribe('crawl_started', handleStarted);
      unsubscribe('crawl_completed', handleCompleted);
      unsubscribe('crawl_failed', handleFailed);
      unsubscribe('crawl_stopped', handleStopped);
    };
  }, [taskId, subscribe, unsubscribe, subscribeToCrawlTask, unsubscribeFromCrawlTask]);

  return {
    progress,
    isRunning,
    error,
  };
};

// Hook for WebSocket connection status
export const useWebSocketConnection = () => {
  const { connectionState, connect, disconnect, reconnect } = useWebSocket();

  return {
    ...connectionState,
    connect,
    disconnect,
    reconnect,
  };
};

export default useWebSocket; 