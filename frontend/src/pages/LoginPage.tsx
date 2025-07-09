import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { AuthLayout } from '../components/auth/AuthLayout';
import type { LoginRequest } from '../types';

export const LoginPage: React.FC = () => {
  const handleLogin = (data: LoginRequest) => {
    console.log('Login data:', data);
  };

  return (
    <AuthLayout title="Sign In">
      <LoginForm onSubmit={handleLogin} />
    </AuthLayout>
  );
};

export default LoginPage; 