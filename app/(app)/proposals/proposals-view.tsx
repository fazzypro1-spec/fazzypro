'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { money } from '@/lib/format';
import type { Profile } from '@/lib/auth';

type Prop = {
  id: string;
  request_id: string;
  amount: number;
  message: string | null;
  status: string;
};

export default function ProposalsView({ profile }: { profile: Profile }) {
  const [props, setProps] = useState<Prop[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('proposals')
        .select('*')
        .eq('pro_id', profile.id)
        .order('created_at', { ascending: false });
      if (active) setProps((data as Prop[]) || []);
    })();
    return () => {
      active = false;
    };
  }, [profile.id]);

  return (
    <div className="panel">
      <h3>Minhas propostas ({props.length})</h3>
      <div className="grid">
        {props.map((p) => (
          <div key={p.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge lime">{money(p.amount)}</span>
              <span className={'badge ' + (p.status === 'aceita' ? 'ok' : p.status === 'recusada' ? 'warn' : 'info')}>
                {p.status}
              </span>
            </div>
            {p.message && <div className="muted" style={{ marginTop: 8 }}>“{p.message}”</div>}
            <Link href="/chat" className="btn ghost sm mt" style={{ display: 'inline-flex' }}>
              Ver conversa
            </Link>
          </div>
        ))}
        {props.length === 0 && <div className="muted">Você ainda não enviou propostas.</div>}
      </div>
    </div>
  );
}
