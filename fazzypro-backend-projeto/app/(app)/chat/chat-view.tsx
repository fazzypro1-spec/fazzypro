'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/auth';

type Channel = {
  id: string;
  client_id: string;
  pro_id: string;
};
type Message = {
  id: string;
  channel_id: string;
  sender_id: string;
  text: string;
  read: boolean;
  created_at: string;
};

export default function ChatView({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carrega canais do usuário + nomes
  useEffect(() => {
    let on = true;
    (async () => {
      const { data } = await supabase
        .from('channels')
        .select('*')
        .or(`client_id.eq.${profile.id},pro_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });
      const list = (data as Channel[]) || [];
      if (!on) return;
      setChannels(list);

      const idSet = new Set<string>();
      list.forEach((c) => {
        idSet.add(c.client_id);
        idSet.add(c.pro_id);
      });
      idSet.delete(profile.id);
      const ids = [...idSet];
      if (ids.length) {
        const { data: prof } = await supabase.from('profiles_public').select('id,name').in('id', ids);
        const map: Record<string, string> = {};
        (prof || []).forEach((p: any) => (map[p.id] = p.name));
        if (on) setNames(map);
      }
    })();
    return () => {
      on = false;
    };
  }, [profile.id]);

  // Carrega mensagens do canal ativo + inscrição realtime
  useEffect(() => {
    if (!active) {
      setMessages([]);
      return;
    }
    let on = true;

    (async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', active)
        .order('created_at', { ascending: true });
      if (on) setMessages((data as Message[]) || []);
    })();

    const channel = supabase
      .channel('messages:' + active)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${active}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => [...prev, m]);
      })
      .subscribe();

    return () => {
      on = false;
      supabase.removeChannel(channel);
    };
  }, [active]);

  // auto scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    if (!text.trim() || !active) return;
    const { error } = await supabase.from('messages').insert({
      channel_id: active,
      sender_id: profile.id,
      text: text.trim(),
    });
    if (!error) setText('');
  }

  const partnerFor = (c: Channel) => (c.client_id === profile.id ? c.pro_id : c.client_id);

  return (
    <div className="panel chat">
      <div style={{ display: 'flex', gap: 14, height: '100%' }}>
        <aside style={{ width: 240, borderRight: '1px solid var(--line)', paddingRight: 14 }}>
          <h3 style={{ fontSize: 15 }}>Conversas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {channels.map((c) => {
              const pid = partnerFor(c);
              return (
                <button
                  key={c.id}
                  onClick={() => setActive(c.id)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 12,
                    background: active === c.id ? 'var(--lime-soft)' : 'var(--surface2)',
                    border: '1px solid ' + (active === c.id ? 'var(--lime)' : 'var(--line2)'),
                  }}
                >
                  <b style={{ fontSize: 14 }}>{names[pid] || 'Conversa'}</b>
                </button>
              );
            })}
            {channels.length === 0 && <span className="muted">Nenhuma conversa. Aceite uma proposta ou envie uma para começar.</span>}
          </div>
        </aside>

        <section style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {active ? (
            <>
              <div ref={scrollRef} className="msgs">
                {messages.map((m) => (
                  <div key={m.id} className={'msg ' + (m.sender_id === profile.id ? 'mine' : 'them')}>
                    {m.text}
                  </div>
                ))}
                {messages.length === 0 && <div className="muted center" style={{ padding: 30 }}>Sem mensagens ainda.</div>}
              </div>
              <div className="chatinput">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Escreva uma mensagem..."
                />
                <button onClick={send}>➤</button>
              </div>
            </>
          ) : (
            <div className="muted center" style={{ padding: 40 }}>Selecione uma conversa.</div>
          )}
        </section>
      </div>
    </div>
  );
}
