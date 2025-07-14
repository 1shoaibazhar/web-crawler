import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CrawlProvider } from './context/CrawlContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { SettingsProvider } from './context/SettingsContext';
import { 
  LoginPage, 
  RegisterPage, 
  DashboardPage, 
  UrlManagement, 
  ResultsDashboard, 
  CrawlDetailsPage,
  WebSocketDemo,
  BulkActionsDemo,
  SettingsPage
} from './pages';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ 
  children, 
  roles = ['user', 'admin'] 
}) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // TODO: Add role-based access control when user roles are implemented
  // if (roles && user && !roles.includes(user.role)) {
  //   return <Navigate to="/dashboard" replace />;
  // }

  return <>{children}</>;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/url-management" element={
        <ProtectedRoute>
          <UrlManagement />
        </ProtectedRoute>
      } />
      <Route path="/results" element={
        <ProtectedRoute>
          <ResultsDashboard />
        </ProtectedRoute>
      } />
      <Route path="/crawl/:id" element={
        <ProtectedRoute>
          <CrawlDetailsPage />
        </ProtectedRoute>
      } />
      <Route path="/websocket-demo" element={
        <ProtectedRoute>
          <WebSocketDemo />
        </ProtectedRoute>
      } />
      <Route path="/bulk-actions-demo" element={
        <ProtectedRoute>
          <BulkActionsDemo />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsPage />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <WebSocketProvider>
          <SettingsProvider>
            <CrawlProvider>
              <AppRoutes />
            </CrawlProvider>
          </SettingsProvider>
        </WebSocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
