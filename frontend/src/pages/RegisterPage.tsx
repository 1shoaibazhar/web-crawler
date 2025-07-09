import React from 'react';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AuthLayout } from '../components/auth/AuthLayout';
import type { RegisterRequest } from '../types';

export const RegisterPage: React.FC = () => {
  const handleRegister = (data: RegisterRequest) => {
    console.log('Register data:', data);
  };

  return (
    <AuthLayout title="Create Account">
      <RegisterForm onSubmit={handleRegister} />
    </AuthLayout>
  );
};

export default RegisterPage; 