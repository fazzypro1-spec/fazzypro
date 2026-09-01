import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Callback do Google OAuth — troca o código por uma sessão.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const role = url.searchParams.get('role') || 'cliente';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Garante que o perfil criado pelo trigger tenha o papel correto.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const profile = await supabase.from('profiles').select('role, name').eq('id', user.id).single();
        if (profile.data && profile.data.role !== role && !profile.data.name) {
          // Perfil recém-criado via Google ainda sem papel/name — atualiza com o role escolhido
          await supabase.from('profiles').update({ role, via: 'google' }).eq('id', user.id);
          return NextResponse.redirect(
            new URL('/auth/complete-profile?role=' + role, url.origin),
          );
        }
      }
      return NextResponse.redirect(new URL('/dashboard', url.origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/login?erro=Falha ao entrar com Google', url.origin));
}
