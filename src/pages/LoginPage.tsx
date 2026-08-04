import React from 'react';
import { AuthPage } from './AuthPage';

interface LoginPageProps {
  initialTab?: 'admin' | 'worker' | 'customer';
  onSuccess: () => void;
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialTab = 'customer', onSuccess, onNavigateRegister }) => {
  return (
    <AuthPage
      initialTab={initialTab}
      initialMode="login"
      onSuccess={onSuccess}
      onNavigateRegister={onNavigateRegister}
    />
  );
};
