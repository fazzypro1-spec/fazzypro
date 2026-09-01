import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// Atualiza a sessão do Supabase a cada navegação (refresh de token).
// Tolerante: se as variáveis do Supabase ainda não foram configuradas
// (ex.: pré-visualização local), apenas deixa a página carregar.
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response;
  }

  let supabase;
  try {
    supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          },
        },
      },
    );
  } catch {
    return response;
  }

  const url = request.nextUrl;
  const path = url.pathname;
  const isAuthRoute = path.startsWith('/auth') || path.startsWith('/api');
  const isPublic = path === '/';

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Sem rede/back ainda — deixa passar (não bloqueia a pré-visualização).
  }

  if (!user) {
    if (!isAuthRoute && !isPublic) {
      return NextResponse.redirect(new URL('/auth/login', url));
    }
    return response;
  }

  if (path === '/auth/login' || path === '/auth/register') {
    return NextResponse.redirect(new URL('/dashboard', url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
