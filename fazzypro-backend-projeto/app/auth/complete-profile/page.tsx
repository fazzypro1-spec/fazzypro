import { Suspense } from 'react';
import CompleteProfileForm from './complete-profile-form';

export const metadata = { title: 'Complete seu cadastro · FazzyPro' };

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div className="auth-wrap" />}>
      <CompleteProfileForm />
    </Suspense>
  );
}
