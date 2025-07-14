import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Globe, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  Bell,
  Search
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../common/Button';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'URL Management', href: '/url-management', icon: Globe },
  { name: 'Results', href: '/results', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Profile', href: '/profile', icon: User },
];

const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isActive = (href: string) => location.pathname === href;
  const handleLogout = () => logout();
  return (
    <>
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="ml-3 text-lg font-semibold text-gray-900">Web Crawler</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      {/* Navigation */}
      <nav className="mt-6 px-3">
        <div className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive(item.href)
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={onClose}
              >
                <Icon className={`
                  mr-3 h-5 w-5
                  ${isActive(item.href) ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
      {/* User section */}
      <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{user?.username || 'User'}</div>
          <div className="text-xs text-gray-500 truncate">{user?.email || 'profile@example.com'}</div>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { state: notificationState } = useNotifications();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar for mobile (only when open) */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out lg:hidden">
          <SidebarContent onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar for desktop (always visible) */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg">
        <SidebarContent />
      </div>

      {/* Main content area, offset by sidebar on desktop */}
      <div className="flex flex-col min-h-screen lg:ml-64">
        {/* Top header */}
        <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Search */}
            <div className="flex-1 max-w-lg mx-4 lg:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks, URLs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md">
                <Bell className="w-5 h-5" />
                {notificationState.notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              {/* User menu */}
              <div className="hidden sm:flex items-center space-x-3">
                <span className="text-sm text-gray-700">{/* username shown in sidebar */}</span>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Main content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto w-full px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 