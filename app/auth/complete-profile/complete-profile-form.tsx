'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cpfMask } from '@/lib/validators';

const CATEGORIES = [
  { id: 'gerais', name: 'Serviços Gerais' },
  { id: 'limpeza', name: 'Limpeza' },
  { id: 'eletrica', name: 'Elétrica' },
  { id: 'hidraulica', name: 'Hidráulica' },
  { id: 'montagem', name: 'Montagem' },
  { id: 'ar', name: 'Ar-Condicionado' },
  { id: 'beleza', name: 'Beleza' },
  { id: 'jardim', name: 'Jardinagem' },
  { id: 'pets', name: 'Banho & Pets' },
];

const EXPERIENCE = [
  { id: 'menos1', name: 'Menos de 1 ano' },
  { id: '1-3', name: '1 a 3 anos' },
  { id: '3-5', name: '3 a 5 anos' },
  { id: '5+', name: 'Mais de 5 anos' },
];

// Etapa 2 — completa o perfil (CPF + endereço). Profissional: categoria/experiência/bio.
export default function CompleteProfileForm() {
  const params = useSearchParams();
  const erro = params.get('erro');
  const role = (params.get('role') as 'cliente' | 'pro') || 'cliente';
  const isPro = role === 'pro';
  const [cpf, setCpf] = useState('');

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">FP</div>
        <h1 className="auth-title">
          Complete seu <em>cadastro</em>
        </h1>
        <p className="auth-sub">Falta pouco. Seus dados ficam seguros.</p>

        {erro && <div className="error">{erro}</div>}

        <form
          action={async (fd) => {
            const { completeProfile } = await import('../register/actions');
            await completeProfile(fd);
          }}
          className="panel"
        >
          <input type="hidden" name="role" value={role} />
          <div className="field">
            <label>Nome completo</label>
            <input name="name" placeholder="Seu nome" required />
          </div>
          <div className="field">
            <label>CPF</label>
            <input
              name="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(cpfMask(e.target.value))}
              required
            />
            <small className="fieldhint">Garante 1 identidade por cadastro — não pode se repetir.</small>
          </div>
          <div className="field">
            <label>Telefone / celular</label>
            <input name="phone" inputMode="tel" placeholder="(11) 98765-4321" required />
          </div>
          <div className="field">
            <label>Cidade</label>
            <input name="city" placeholder="Ex.: São Paulo — SP" required />
          </div>
          <div className="formrow">
            <div className="field">
              <label>Bairro</label>
              <input name="district" placeholder="Bela Vista" required />
            </div>
            <div className="field">
              <label>Rua</label>
              <input name="street" placeholder="Rua / Avenida" required />
            </div>
          </div>
          <div className="field">
            <label>Número</label>
            <input name="number" placeholder="1578" required />
          </div>

          {isPro && (
            <>
              <div className="field">
                <label>Categoria do serviço</label>
                <select name="category" defaultValue="gerais">
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Experiência</label>
                <select name="experience" defaultValue="">
                  <option value="">Selecione</option>
                  {EXPERIENCE.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Descrição</label>
                <textarea name="bio" placeholder="Resumo do seu trabalho" />
              </div>
            </>
          )}

          <button className="btn lime">Concluir cadastro</button>
        </form>
      </div>
    </div>
  );
}
