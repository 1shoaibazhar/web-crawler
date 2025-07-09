import React from 'react';
import { AuthLayout } from '../components/auth/AuthLayout';
import { RegisterForm } from '../components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {
  const handleRegister = (data: { email: string; password: string; confirmPassword: string }) => {
    // TODO: Implement registration logic
    console.log('Registration submitted:', data);
  };

  return (
    <AuthLayout title="Sign Up">
      <RegisterForm onSubmit={handleRegister} />
      <div className="text-center mt-4">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </p>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage; 