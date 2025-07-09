import React from 'react';
import { useWebSocketConnection } from '../../hooks/useWebSocket';

export const WebSocketStatus: React.FC = () => {
  const { isConnected, isConnecting, isReconnecting, error, lastConnected, connectionAttempts } = useWebSocketConnection();

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500';
    if (isConnecting || isReconnecting) return 'bg-yellow-500';
    if (error) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (isConnected) return 'Connected';
    if (isConnecting) return 'Connecting...';
    if (isReconnecting) return `Reconnecting... (${connectionAttempts}/5)`;
    if (error) return 'Disconnected';
    return 'Offline';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-gray-700">{getStatusText()}</span>
      {lastConnected && (
        <span className="text-gray-500 text-xs">
          Last: {new Date(lastConnected).toLocaleTimeString()}
        </span>
      )}
      {error && (
        <span className="text-red-500 text-xs" title={error}>
          ⚠️
        </span>
      )}
    </div>
  );
};

export default WebSocketStatus; 