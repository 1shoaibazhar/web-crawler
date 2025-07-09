import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { LoginForm } from '../components/auth/LoginForm';

export const LoginPage: React.FC = () => {
  const handleLogin = (data: { email: string; password: string }) => {
    // TODO: Implement login logic
    console.log('Login submitted:', data);
  };

  return (
    <AuthLayout title="Sign In">
      <LoginForm onSubmit={handleLogin} />
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:text-blue-500">
            Sign up
          </a>
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage; 