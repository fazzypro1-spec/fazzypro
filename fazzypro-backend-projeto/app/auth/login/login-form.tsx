'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';

// Login por e-mail (Server Action) + botão Google.
export default function LoginForm() {
  const params = useSearchParams();
  const router = useRouter();
  const erro = params.get('erro');
  const mensagem = params.get('mensagem');
  const [busy, setBusy] = useState(false);

  async function onGoogle() {
    setBusy(true);
    router.push('/api/auth/google?role=cliente');
  }

  return (
    <div className="auth-wrap">
      <div className="auth-box">
        <div className="auth-logo">FP</div>
        <h1 className="auth-title">
          Fazzy<em>Pro</em>
        </h1>
        <p className="auth-sub">O SERVIÇO QUE VOCÊ PEDE, A GENTE RESOLVE</p>

        {erro && <div className="error">{erro}</div>}
        {mensagem && <div className="success">{mensagem}</div>}

        <form
          action={async (fd) => {
            setBusy(true);
            const { login } = await import('./actions');
            await login(fd);
          }}
          className="panel"
        >
          <div className="field">
            <label>E-mail</label>
            <input name="email" type="email" inputMode="email" placeholder="voce@exemplo.com" required />
          </div>
          <div className="field">
            <label>Senha</label>
            <input name="password" type="password" placeholder="Sua senha" required />
          </div>
          <button className="btn lime" disabled={busy}>
            {busy ? <span className="spinner" /> : 'Entrar'}
          </button>
        </form>

        <div className="mt" style={{ display: 'grid', gap: '10px' }}>
          <button className="btn google" onClick={onGoogle} disabled={busy}>
            Continuar com Google
          </button>
          <a className="btn ghost" href="/auth/register">
            Criar conta grátis
          </a>
        </div>
      </div>
    </div>
  );
}
