import { requireUser, getProfile } from '@/lib/auth';
import AppShell from './app-shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const profile = await getProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
