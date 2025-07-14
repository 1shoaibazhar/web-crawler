import React from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Notification } from '../../context/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  onRemove: (id: string) => void;
  onAction?: (action: Notification['action']) => void;
}

const getIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
    default:
      return <Info className="w-5 h-5 text-gray-500" />;
  }
};

const getBackgroundColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'info':
      return 'bg-blue-50 border-blue-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const getTextColor = (type: Notification['type']) => {
  switch (type) {
    case 'success':
      return 'text-green-800';
    case 'error':
      return 'text-red-800';
    case 'warning':
      return 'text-yellow-800';
    case 'info':
      return 'text-blue-800';
    default:
      return 'text-gray-800';
  }
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onRemove,
  onAction,
}) => {
  const handleAction = () => {
    if (notification.action && onAction) {
      onAction(notification.action);
    }
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border shadow-lg max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        hover:shadow-xl hover:scale-[1.02]
        ${getBackgroundColor(notification.type)}
        animate-in slide-in-from-right-full
      `}
    >
      {/* Close button */}
      <button
        onClick={() => onRemove(notification.id)}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-black/10 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      {/* Icon and content */}
      <div className="flex items-start space-x-3 pr-6">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className={`text-sm font-semibold ${getTextColor(notification.type)}`}>
            {notification.title}
          </h4>

          {/* Message */}
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            {notification.message}
          </p>

          {/* Timestamp */}
          <p className="mt-2 text-xs text-gray-400">
            {notification.timestamp.toLocaleTimeString()}
          </p>

          {/* Action button */}
          {notification.action && (
            <button
              onClick={handleAction}
              className={`
                mt-3 px-3 py-1.5 text-xs font-medium rounded-md
                transition-colors duration-200
                ${notification.type === 'success' ? 'bg-green-100 text-green-700 hover:bg-green-200' : ''}
                ${notification.type === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' : ''}
                ${notification.type === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : ''}
                ${notification.type === 'info' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
              `}
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{
              animation: `shrink ${notification.duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// Add CSS animation for progress bar
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style); 