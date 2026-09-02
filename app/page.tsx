// Landing page (rota "/") — a página principal do FazzyPro.
// Leva o visitante para criar conta (cliente/profissional) ou entrar.
// Nenhuma lógica de autenticação aqui: é a vitrine do serviço.
export default function Home() {
  return (
    <main className="landing">
      <section className="landing-hero">
        <div className="landing-logo">FP</div>
        <h1>
          Fazzy<em>Pro</em>
        </h1>
        <p className="tagline">
          O serviço que você pede, a gente resolve. Publique o que precisa, receba
          propostas de profissionais verificados e feche tudo pelo chat.
        </p>

        <div className="landing-cta">
          <a className="btn lime" href="/auth/register?role=cliente">
            Quero contratar
          </a>
          <a className="btn ghost" href="/auth/register?role=pro">
            Sou profissional
          </a>
          <a className="btn ghost" href="/auth/login">
            Já tenho conta
          </a>
        </div>

        <p className="landing-dots">
          Cliente e Profissional cadastram-se em 2 passos · CPF único · Pagamento protegido
        </p>
      </section>

      <section className="landing-features">
        <h2>Como funciona</h2>
        <div className="landing-grid">
          <div className="feature">
            <div className="f-ico">{icon('pencil')}</div>
            <b>1. Publique o pedido</b>
            <p>
              Descreva o que precisa. Nossa IA sugere a categoria, o que falta e um
              orçamento de referência.
            </p>
          </div>
          <div className="feature">
            <div className="f-ico">{icon('chat')}</div>
            <b>2. Receba propostas</b>
            <p>
              Profissionais verificados enviam propostas. Compare e aceite a melhor.
            </p>
          </div>
          <div className="feature">
            <div className="f-ico">{icon('shield')}</div>
            <b>3. Feche e pague com segurança</b>
            <p>
              Combine pelo chat em tempo real e conclua o pagamento por Pix ou cartão,
              protegido pelo FazzyPro.
            </p>
          </div>
        </div>
      </section>

      <footer className="landing-foot">
        © {new Date().getFullYear()} FazzyPro — Feito no Brasil. <b>O serviço que você pede, a gente resolve.</b>
      </footer>
    </main>
  );
}

function icon(type: 'pencil' | 'chat' | 'shield') {
  const paths: Record<typeof type, string> = {
    pencil:
      '<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    chat:
      '<path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z"/>',
    shield:
      '<path d="M12 22s8-3 8-10V5l-8-3-8 3v7c0 7 8 10 8 10Z"/>',
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: paths[type] }}
    />
  );
}
