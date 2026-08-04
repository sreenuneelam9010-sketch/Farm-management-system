import React from 'react';
import { AuthPage } from './AuthPage';

interface RegisterPageProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onNavigateLogin }) => {
  return (
    <AuthPage
      initialTab="customer"
      initialMode="register"
      onSuccess={onSuccess}
      onNavigateLogin={onNavigateLogin}
    />
  );
};
