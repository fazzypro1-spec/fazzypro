'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { guessCategory } from '@/lib/ai';
import { buildAddress } from '@/lib/validators';
import type { Profile } from '@/lib/auth';

export default function PublishForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [desc, setDesc] = useState('');
  const [city, setCity] = useState('São Paulo — SP');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [when, setWhen] = useState('Amanhã');
  const [budget, setBudget] = useState(200);
  const [category, setCategory] = useState('gerais');
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState('');

  function autoGuess() {
    setCategory(guessCategory(desc));
  }

  async function publish() {
    setBusy(true);
    setErro('');
    if (desc.trim().length < 10) {
      setErro('Descreva melhor o que você precisa.');
      setBusy(false);
      return;
    }
    const supabase = createClient();
    const address = buildAddress({ street, number, district, city });
    const title = desc.trim().split('\n')[0].slice(0, 60) || 'Serviço';

    const { data: req, error } = await supabase
      .from('requests')
      .insert({
        client_id: profile.id,
        title,
        description: desc.trim(),
        category,
        address,
        city,
        when,
        budget,
        status: 'aguardando',
      })
      .select('*')
      .single();

    if (error) {
      setErro(error.message);
      setBusy(false);
      return;
    }

    // Notifica profissionais (admin server-side faz melhor; aqui simula via anon com RLS de insert inexistente).
    toasts(req.id, title);
  }

  function toasts(reqId: string, title: string) {
    router.push('/requests?criado=' + reqId);
  }

  return (
    <div className="panel">
      <h3>Publicar um pedido</h3>
      {erro && <div className="error">{erro}</div>}
      <div className="field">
        <label>O que você precisa?</label>
        <textarea
          rows={4}
          placeholder="Ex.: a torneira da cozinha está vazando e molhou o armário. Preciso resolver hoje."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onBlur={autoGuess}
        />
      </div>
      <div className="field">
        <label>Categoria (sugerida pela IA)</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="gerais">Serviços Gerais</option>
          <option value="limpeza">Limpeza</option>
          <option value="eletrica">Elétrica</option>
          <option value="hidraulica">Hidráulica</option>
          <option value="montagem">Montagem</option>
          <option value="ar">Ar-Condicionado</option>
          <option value="beleza">Beleza</option>
          <option value="jardim">Jardinagem</option>
          <option value="pets">Banho & Pets</option>
        </select>
      </div>

      <div className="grid">
        <div className="field">
          <label>Cidade</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label>Bairro</label>
          <input value={district} onChange={(e) => setDistrict(e.target.value)} />
        </div>
        <div className="field">
          <label>Rua</label>
          <input value={street} onChange={(e) => setStreet(e.target.value)} />
        </div>
        <div className="field">
          <label>Número</label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div className="field">
          <label>Quando precisa</label>
          <select value={when} onChange={(e) => setWhen(e.target.value)}>
            <option>Hoje</option>
            <option>Amanhã</option>
            <option>Nesta semana</option>
            <option>Fim de semana</option>
          </select>
        </div>
        <div className="field">
          <label>Orçamento (R$)</label>
          <input type="number" value={budget} onChange={(e) => setBudget(+e.target.value)} />
        </div>
      </div>

      <button className="btn lime" onClick={publish} disabled={busy}>
        {busy ? <span className="spinner" /> : 'Publicar & receber propostas'}
      </button>
    </div>
  );
}
