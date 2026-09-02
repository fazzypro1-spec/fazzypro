'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cpfDigits, cpfValid, emailValid, buildAddress } from '@/lib/validators';

// Etapa 1 — cria a conta (e-mail + senha + papel). O perfil nasce vazio.
export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const role = String(formData.get('role') || 'cliente');
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const password2 = String(formData.get('password2') || '');

  if (!emailValid(email)) return redirect('/auth/register?erro=E-mail inválido');
  if (password.length < 6) return redirect('/auth/register?erro=A senha precisa de ao menos 6 caracteres');
  if (password !== password2) return redirect('/auth/register?erro=As senhas não coincidem');

  // Anti-duplicata de e-mail: o próprio Supabase impede e-mail repetido no signUp.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        via: 'email',
        name: '',
      },
      // Onde o link de confirmação deve levar o usuário (callback do app).
      // Sem isso, o Supabase usa o "Site URL" padrão e pode dar 404.
      emailRedirectTo: `${siteUrl}/auth/callback?role=${role}`,
    },
  });

  if (error) return redirect('/auth/register?erro=' + encodeURIComponent(error.message));

  // Com verificação de e-mail desabilitada, a sessão já vem ativa:
  if (data.session) {
    redirect('/auth/complete-profile?role=' + role);
  }

  // Caso o projeto exija confirmação de e-mail:
  redirect(
    '/auth/register?mensagem=' +
      encodeURIComponent(
        'Quase lá! Enviamos um link de confirmação para o seu e-mail. ' +
          'Clique nele para ativar a conta e depois complete seu perfil.',
      ),
  );
}

// Etapa 2 — completa o perfil (CPF anti-duplicata + dados de endereço).
export async function completeProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect('/auth/login');

  const name = String(formData.get('name') || '').trim();
  const cpf = cpfDigits(String(formData.get('cpf') || ''));
  const phone = String(formData.get('phone') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const district = String(formData.get('district') || '').trim();
  const street = String(formData.get('street') || '').trim();
  const number = String(formData.get('number') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const experience = String(formData.get('experience') || '').trim();
  const bio = String(formData.get('bio') || '').trim();

  if (!name) return redirect('/auth/complete-profile?erro=Preencha seu nome');
  if (!cpfValid(cpf)) return redirect('/auth/complete-profile?erro=CPF inválido');
  if (!phone) return redirect('/auth/complete-profile?erro=Informe seu telefone');
  if (!city || !district || !street || !number)
    return redirect('/auth/complete-profile?erro=Preencha seu endereço completo');

  const admin = createAdminClient();

  // Anti-duplicata de CPF
  const { data: dup } = await admin.from('profiles').select('id').eq('cpf', cpf).maybeSingle();
  if (dup) return redirect('/auth/complete-profile?erro=Este CPF já está cadastrado');

  // Atualiza o perfil (admin ignora RLS)
  const initials = (name.split(/\s+/)[0]?.[0] || '') + (name.split(/\s+/)[1]?.[0] || '');
  const { error } = await admin.from('profiles').update({
    name,
    cpf,
    phone,
    city,
    district,
    street,
    number,
    address: buildAddress({ street, number, district, city }),
    initials: initials.toUpperCase(),
    ...(category ? { category } : {}),
    ...(experience ? { experience } : {}),
    ...(bio ? { bio } : {}),
  }).eq('id', user.id);

  if (error) return redirect('/auth/complete-profile?erro=' + encodeURIComponent(error.message));

  redirect('/dashboard');
}
