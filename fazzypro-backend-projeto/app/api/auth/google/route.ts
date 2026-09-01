import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Inicia o fluxo de login com Google (OAuth). Redireciona para o Google.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role') || 'cliente';
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?role=${role}`,
    },
  });

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/auth/login?erro=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(data.url);
}
