import React from 'react';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import type { Notification } from '../../context/NotificationContext';
import { NotificationToast } from './NotificationToast';

export const NotificationContainer: React.FC = () => {
  const { state, removeNotification, clearAll, setOpen } = useNotifications();

  const handleAction = (action: NonNullable<Notification['action']>) => {
    action.onClick();
  };

  if (state.notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-lg p-3 border">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            Notifications ({state.notifications.length})
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={clearAll}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Clear all notifications"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {state.notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  );
}; 