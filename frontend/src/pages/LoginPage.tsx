import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { AuthLayout } from '../components/auth/AuthLayout';
import { useAuth } from '../context/AuthContext';
import type { LoginRequest } from '../types';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (data: LoginRequest) => {
    try {
      await login(data);
      // Redirect to dashboard on successful login
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
      console.error('Login failed:', error);
    }
  };

  return (
    <AuthLayout title="Sign In">
      <LoginForm onSubmit={handleLogin} />
    </AuthLayout>
  );
};

export default LoginPage; 