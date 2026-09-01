import { requireRole } from '@/lib/auth';
import RequestsView from './requests-view';

export const metadata = { title: 'Pedidos · FazzyPro' };

export default async function RequestsPage() {
  const profile = await requireRole('either');
  return <RequestsView profile={profile} />;
}
