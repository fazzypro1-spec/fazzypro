import { Suspense } from 'react';
import RegisterForm from './register-form';

export const metadata = { title: 'Criar conta · FazzyPro' };

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="auth-wrap" />}>
      <RegisterForm />
    </Suspense>
  );
}
