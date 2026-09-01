import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type Profile = {
  id: string;
  role: 'cliente' | 'pro';
  name: string;
  initials: string | null;
  phone: string | null;
  city: string | null;
  district: string | null;
  street: string | null;
  number: string | null;
  address: string | null;
  cpf: string | null;
  category: string | null;
  experience: string | null;
  bio: string | null;
  rating: number;
  jobs: number;
  verified: boolean;
  level: string | null;
  via: string | null;
};

// Busca a sessão atual; redireciona ao login se não houver.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');
  return user;
}

// Busca o perfil (linha em profiles) do usuário logado.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return (data as Profile) || null;
}

// Garante que o usuário logado tem o papel esperado (cliente/pro).
export async function requireRole(role: 'cliente' | 'pro' | 'either') {
  const profile = await getProfile();
  if (!profile) redirect('/auth/login');
  if (role !== 'either' && profile!.role !== role) redirect('/dashboard');
  return profile!;
}
