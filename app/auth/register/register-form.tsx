'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

// Etapa 1 — criar conta: papel (cliente/pro) + e-mail + senha.
export default function RegisterForm() {
  const params = useSearchParams();
  const erro = params.get('erro');
  const [role, setRole] = useState<'cliente' | 'pro'>('cliente');

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">FP</div>
        <h1 className="auth-title">
          Criar <em>conta</em> grátis
        </h1>
        <p className="auth-sub">Você completa seu perfil depois. É rápido.</p>

        {erro && <div className="error">{erro}</div>}

        <form
          action={async (fd) => {
            fd.set('role', role);
            const { createAccount } = await import('./actions');
            await createAccount(fd);
          }}
          className="panel"
        >
          <div className="field">
            <label>Como você vai usar o FazzyPro?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className={role === 'cliente' ? 'btn lime' : 'btn ghost'}
                onClick={() => setRole('cliente')}
              >
                Sou Cliente
              </button>
              <button
                type="button"
                className={role === 'pro' ? 'btn lime' : 'btn ghost'}
                onClick={() => setRole('pro')}
              >
                Sou Profissional
              </button>
            </div>
          </div>
          <div className="field">
            <label>E-mail</label>
            <input name="email" type="email" inputMode="email" placeholder="voce@exemplo.com" required />
          </div>
          <div className="field">
            <label>Senha</label>
            <input name="password" type="password" placeholder="Mínimo 6 caracteres" required />
          </div>
          <div className="field">
            <label>Confirmar senha</label>
            <input name="password2" type="password" placeholder="Repita a senha" required />
          </div>
          <button className="btn lime">Criar conta</button>
        </form>

        <div className="mt center">
          <span className="muted">Já tem conta?</span>{' '}
          <a href="/auth/login" style={{ color: 'var(--lime)', fontWeight: 800 }}>
            Entrar
          </a>
        </div>
      </div>
    </div>
  );
}
