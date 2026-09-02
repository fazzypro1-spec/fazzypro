import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Tipos de código OTP aceitos pelo verifyOtp (link de confirmação por token).
type OtpType = 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email';

// Callback de autenticação: cobre o Google OAuth (code) e a confirmação de
// e-mail (code ou token_hash + type). Troca o código por uma sessão e leva o
// usuário para o perfil (se novo) ou para o painel (se já completo).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  // Erro retornado pelo Supabase (ex.: usuário cancelou o login no Google).
  const oauthErr = url.searchParams.get('error');
  const oauthErrDesc = url.searchParams.get('error_description');
  if (oauthErr) {
    return NextResponse.redirect(
      new URL(`/auth/login?erro=${encodeURIComponent(oauthErrDesc || oauthErr)}`, siteUrl),
    );
  }

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as OtpType | null;
  const role = url.searchParams.get('role') || 'cliente';

  const supabase = await createClient();

  // Fluxo A — temos um `code` (PKCE): Google OAuth ou confirmação de e-mail.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return afterAuth(supabase, role, siteUrl);
  }

  // Fluxo B — temos `token_hash` + `type`: link de confirmação por token.
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return afterAuth(supabase, role, siteUrl);
  }

  return NextResponse.redirect(
    new URL('/auth/login?erro=Falha ao autenticar. Tente novamente.', siteUrl),
  );
}

// Após trocar o código por uma sessão: garante o papel, e decide entre
// "completar perfil" (novo usuário) e "painel" (perfil já completo).
async function afterAuth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roleFromUrl: string,
  siteUrl: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(
      new URL('/auth/login?erro=Sessão não encontrada. Tente novamente.', siteUrl),
    );
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single();

  // Papel do usuário: prioriza o já salvo no perfil, senão o da URL, senão o do metadata.
  const metaRole = (user.user_metadata?.role as string) || 'cliente';
  const finalRole = profile?.role || roleFromUrl || metaRole;

  // Perfil recém-criado (sem nome) e papel diferente do registrado: atualiza.
  if (profile && !profile.name && profile.role !== finalRole) {
    await supabase.from('profiles').update({ role: finalRole }).eq('id', user.id);
  }

  if (!profile?.name) {
    return NextResponse.redirect(
      new URL(`/auth/complete-profile?role=${finalRole}`, siteUrl),
    );
  }

  return NextResponse.redirect(new URL('/dashboard', siteUrl));
}
