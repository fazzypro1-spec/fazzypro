import { requireRole } from '@/lib/auth';
import PublishForm from './publish-form';

export const metadata = { title: 'Publicar pedido · FazzyPro' };

export default async function PublishPage() {
  const profile = await requireRole('cliente');
  return <PublishForm profile={profile} />;
}
