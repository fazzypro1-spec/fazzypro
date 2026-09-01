'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/auth';

type Request = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  address: string | null;
  budget: number | null;
  created_at: string;
};

export default function HomeView({ profile }: { profile: Profile }) {
  const isPro = profile.role === 'pro';
  const [requests, setRequests] = useState<Request[]>([]);
  const [open, setOpen] = useState(0);
  const [proposals, setProposals] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      if (isPro) {
        const { data } = await supabase
          .from('requests')
          .select('*')
          .eq('status', 'aguardando')
          .order('created_at', { ascending: false })
          .limit(10);
        if (active) setRequests((data as Request[]) || []);
        const { data: p } = await supabase
          .from('proposals')
          .select('id', { count: 'exact', head: true })
          .eq('pro_id', profile.id);
        if (active) setProposals(p?.length || 0);
      } else {
        const { data } = await supabase
          .from('requests')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (active) {
          setRequests((data as Request[]) || []);
          setOpen((data || []).filter((r) => r.status === 'aguardando').length);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isPro, profile.id]);

  return (
    <div className="panel">
      <h3>
        Olá, {profile.name.split(' ')[0]}!{' '}
        <span className="muted">({isPro ? 'Profissional' : 'Cliente'})</span>
      </h3>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 8 }}>
        {isPro ? (
          <>
            <div className="badge lime">{open} solicitações abertas</div>
            <div className="badge info">{proposals} propostas enviadas</div>
          </>
        ) : (
          <>
            <div className="badge lime">{open} pedido(s) aguardando</div>
            <div className="badge info">{requests.length} pedido(s)</div>
          </>
        )}
      </div>

      {isPro ? (
        <div className="mt" style={{ display: 'flex', gap: 10 }}>
          <Link href="/requests" className="btn lime" style={{ flex: 1 }}>
            Ver novas solicitações
          </Link>
          <Link href="/proposals" className="btn ghost" style={{ flex: 1 }}>
            Minhas propostas
          </Link>
        </div>
      ) : (
        <div className="mt" style={{ display: 'flex', gap: 10 }}>
          <Link href="/publish" className="btn lime" style={{ flex: 1 }}>
            Publicar pedido
          </Link>
          <Link href="/requests" className="btn ghost" style={{ flex: 1 }}>
            Meus pedidos
          </Link>
        </div>
      )}

      <div className="mt grid">
        {requests.length === 0 && <div className="muted">Nenhum pedido por aqui ainda.</div>}
        {requests.map((r) => (
          <Link key={r.id} href="/requests" className="card">
            <h4>{r.title}</h4>
            <div className="muted">{r.description.slice(0, 90)}…</div>
            <div style={{ marginTop: 8 }} className="badge lime">
              {r.status}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
