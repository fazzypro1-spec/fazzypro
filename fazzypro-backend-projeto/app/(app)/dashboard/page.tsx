import { requireRole } from '@/lib/auth';
import HomeView from './home-view';

export const metadata = { title: 'Início · FazzyPro' };

export default async function DashboardPage() {
  const profile = await requireRole('either');
  return <HomeView profile={profile} />;
}
