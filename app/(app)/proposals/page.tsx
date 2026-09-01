import { requireRole } from '@/lib/auth';
import ProposalsView from './proposals-view';

export const metadata = { title: 'Minhas propostas · FazzyPro' };

export default async function ProposalsPage() {
  const profile = await requireRole('pro');
  return <ProposalsView profile={profile} />;
}
