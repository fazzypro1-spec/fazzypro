'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Profile } from '@/lib/auth';

const NAV_CLIENTE = [
  { href: '/dashboard', label: 'Início', key: 'dashboard' },
  { href: '/publish', label: 'Publicar', key: 'publish' },
  { href: '/requests', label: 'Pedidos', key: 'requests' },
  { href: '/chat', label: 'Chat', key: 'chat' },
];

const NAV_PRO = [
  { href: '/dashboard', label: 'Início', key: 'dashboard' },
  { href: '/requests', label: 'Solicitações', key: 'requests' },
  { href: '/proposals', label: 'Propostas', key: 'proposals' },
  { href: '/chat', label: 'Chat', key: 'chat' },
];

export default function AppShell({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const isPro = profile?.role === 'pro';
  const nav = isPro ? NAV_PRO : NAV_CLIENTE;

  async function signout() {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/auth/login';
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/dashboard" className="brand">
            <span className="mark">FP</span>
            <span>
              Fazzy<em>Pro</em>
            </span>
          </Link>
          <nav className="topright" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {nav.map((n) => {
              const active = pathname === n.href;
              return (
                <Link
                  key={n.key}
                  href={n.href}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 11,
                    fontSize: 13.5,
                    fontWeight: 800,
                    color: active ? '#10150A' : 'var(--muted)',
                    background: active ? 'linear-gradient(135deg,var(--lime),var(--lime2))' : 'transparent',
                  }}
                >
                  {n.label}
                </Link>
              );
            })}
            <button
              onClick={signout}
              style={{ padding: '9px 14px', borderRadius: 11, fontSize: 13.5, fontWeight: 800, color: 'var(--soft)' }}
            >
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="content">{children}</main>
      <footer>
        Fazzy<strong>Pro</strong> · <b>Você pede. A gente vai.</b> · Mercado Brasil
      </footer>
    </>
  );
}
