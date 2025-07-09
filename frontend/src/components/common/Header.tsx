import React from 'react';

interface HeaderProps {
  title?: string;
  user?: { name: string; email: string };
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, user, onLogout }) => {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {title || 'Web Crawler'}
            </h1>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.name}</span>
                <span className="text-gray-500 ml-2">{user.email}</span>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="text-sm text-red-600 hover:text-red-500"
                >
                  Logout
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header; 