import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FazzyPro — O serviço que você pede, a gente resolve',
  description:
    'Peça qualquer serviço, receba propostas de profissionais e feche pelo chat. Mercado Brasil.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app">{children}</div>
      </body>
    </html>
  );
}
