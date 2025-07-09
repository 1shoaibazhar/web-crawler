import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  // TODO: Implement authentication check
  const isAuthenticated = true; // Placeholder

  if (!isAuthenticated) {
    // TODO: Redirect to login page
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 