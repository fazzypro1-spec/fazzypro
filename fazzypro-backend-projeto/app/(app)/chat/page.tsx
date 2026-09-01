import { requireRole } from '@/lib/auth';
import ChatView from './chat-view';

export const metadata = { title: 'Chat · FazzyPro' };

export default async function ChatPage() {
  const profile = await requireRole('either');
  return <ChatView profile={profile} />;
}
