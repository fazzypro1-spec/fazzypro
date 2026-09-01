'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { money } from '@/lib/format';
import type { Profile } from '@/lib/auth';

type Req = {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string | null;
  address: string | null;
  when: string | null;
  budget: number | null;
  status: string;
  accepted_pro: string | null;
};

type Prop = {
  id: string;
  request_id: string;
  pro_id: string;
  amount: number;
  message: string | null;
  status: string;
};

export default function RequestsView({ profile }: { profile: Profile }) {
  const isPro = profile.role === 'pro';
  const router = useRouter();
  const [reqs, setReqs] = useState<Req[]>([]);
  const [props, setProps] = useState<Prop[]>([]);
  const [proNames, setProNames] = useState<Record<string, string>>({});
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      let data: Req[] = [];
      if (isPro) {
        const { data: d } = await supabase
          .from('requests')
          .select('*')
          .eq('status', 'aguardando')
          .order('created_at', { ascending: false });
        data = (d as Req[]) || [];

        // nomes dos clientes (view pública)
        const ids = [...new Set(data.map((r) => r.client_id))];
        const { data: prof } = await supabase
          .from('profiles_public')
          .select('id,name')
          .in('id', ids);
        const map: Record<string, string> = {};
        (prof || []).forEach((p: any) => (map[p.id] = p.name));
        if (active) setClientNames(map);
      } else {
        const { data: d } = await supabase
          .from('requests')
          .select('*')
          .eq('client_id', profile.id)
          .order('created_at', { ascending: false });
        data = (d as Req[]) || [];

        // propostas dos seus pedidos
        const ids = data.map((r) => r.id);
        if (ids.length) {
          const { data: p } = await supabase.from('proposals').select('*').in('request_id', ids);
          const list = (p as Prop[]) || [];
          if (active) setProps(list);

          const proIds = [...new Set(list.map((x) => x.pro_id))];
          const { data: prof } = await supabase
            .from('profiles_public')
            .select('id,name')
            .in('id', proIds);
          const map: Record<string, string> = {};
          (prof || []).forEach((x: any) => (map[x.id] = x.name));
          if (active) setProNames(map);
        } else if (active) {
          setProps([]);
        }
      }
      if (active) setReqs(data);
    }

    load();
    return () => {
      active = false;
    };
  }, [isPro, profile.id]);

  async function accept(reqId: string, proId: string) {
    setBusy(reqId);
    const supabase = createClient();
    // marca a proposta aceita e rejeita as demais
    await supabase
      .from('proposals')
      .update({ status: 'aceita' })
      .eq('request_id', reqId)
      .eq('pro_id', proId);
    await supabase
      .from('proposals')
      .update({ status: 'recusada' })
      .eq('request_id', reqId)
      .neq('pro_id', proId);
    // atualiza o pedido
    await supabase
      .from('requests')
      .update({ status: 'em_andamento', accepted_pro: proId })
      .eq('id', reqId);
    // cria canal de chat se não existir
    const { data: ch } = await supabase
      .from('channels')
      .select('id')
      .eq('client_id', profile.id)
      .eq('pro_id', proId)
      .maybeSingle();
    if (!ch) {
      await supabase
        .from('channels')
        .insert({ request_id: reqId, client_id: profile.id, pro_id: proId })
        .select();
    }
    setBusy(null);
    router.push('/chat');
  }

  async function sendProposal(req: Req, amount: number, message: string) {
    setBusy(req.id);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('proposals')
      .insert({ request_id: req.id, pro_id: profile.id, amount, message })
      .select()
      .single();
    if (!error) {
      // garante canal
      const { data: ch } = await supabase
        .from('channels')
        .select('id')
        .eq('client_id', req.client_id)
        .eq('pro_id', profile.id)
        .maybeSingle();
      if (!ch) {
        await supabase
          .from('channels')
          .insert({ request_id: req.id, client_id: req.client_id, pro_id: profile.id })
          .select();
      }
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="panel">
      <h3>{isPro ? 'Solicitações abertas' : 'Meus pedidos'}</h3>
      <div className="grid">
        {reqs.map((r) => (
          <RequestCard
            key={r.id}
            req={r}
            isPro={isPro}
            props={props.filter((p) => p.request_id === r.id)}
            proNames={proNames}
            clientName={clientNames[r.client_id]}
            busy={busy === r.id}
            onAccept={(pid) => accept(r.id, pid)}
            onProposal={(amount, msg) => sendProposal(r, amount, msg)}
          />
        ))}
        {reqs.length === 0 && <div className="muted">Nada por aqui ainda.</div>}
      </div>
    </div>
  );
}

function RequestCard({
  req,
  isPro,
  props,
  proNames,
  clientName,
  busy,
  onAccept,
  onProposal,
}: {
  req: Req;
  isPro: boolean;
  props: Prop[];
  proNames: Record<string, string>;
  clientName?: string;
  busy: boolean;
  onAccept: (proId: string) => void;
  onProposal: (amount: number, message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(120);
  const [msg, setMsg] = useState('');

  return (
    <div className="card">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="badge lime">{req.category}</span>
        <span className="badge info">{req.status}</span>
      </div>
      <h4 style={{ marginTop: 8 }}>{req.title}</h4>
      <div className="muted">{req.description}</div>
      <div className="muted" style={{ marginTop: 8 }}>
        {clientName ? `Pedido de ${clientName}` : ' '} · {req.address}
      </div>
      <div className="muted" style={{ marginTop: 6 }}>
        Orçamento: {money(req.budget)} · {req.when}
      </div>

      {isPro ? (
        busy ? (
          <span className="spinner" />
        ) : open ? (
          <div className="mt">
            <div className="field">
              <label>Seu valor (R$)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} />
            </div>
            <div className="field">
              <label>Mensagem</label>
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Explique seu atendimento, prazo, o que está incluso..." />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn ghost" style={{ flex: 1 }} onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button className="btn lime" style={{ flex: 1 }} onClick={() => onProposal(amount, msg)}>
                Enviar proposta
              </button>
            </div>
          </div>
        ) : (
          <button className="btn lime mt" onClick={() => setOpen(true)}>
            Enviar proposta
          </button>
        )
      ) : (
        <div className="mt">
          {props.length === 0 && <div className="muted">Ainda sem propostas.</div>}
          {props.map((p) => (
            <div key={p.id} className="card" style={{ background: 'var(--surface2)', boxShadow: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b>{proNames[p.pro_id] || 'Profissional'}</b>
                <b style={{ color: 'var(--lime)' }}>{money(p.amount)}</b>
              </div>
              {p.message && <div className="muted" style={{ marginTop: 6 }}>“{p.message}”</div>}
              {p.status === 'aceita' ? (
                <span className="badge ok mt">Aceita</span>
              ) : (
                <button className="btn lime sm mt" onClick={() => onAccept(p.pro_id)} disabled={busy}>
                  Aceitar proposta
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
