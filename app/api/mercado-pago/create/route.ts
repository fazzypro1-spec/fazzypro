import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createPixPayment, createCheckoutPreference } from '@/lib/mercado-pago';

const FEE = 0.12; // taxa da plataforma (12%)

export const runtime = 'nodejs';

// Cria um pagamento para um pedido (usado ao clicar "Concluir & pagar").
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { request_id, method } = await req.json();
    if (!request_id) return NextResponse.json({ error: 'request_id é obrigatório' }, { status: 400 });

    // O cliente só pode pagar um pedido que é dele.
    const { data: request, error: reqErr } = await supabase
      .from('requests')
      .select('*')
      .eq('id', request_id)
      .eq('client_id', user.id)
      .single();
    if (reqErr || !request) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const acceptedPro = request.accepted_pro;
    if (!acceptedPro) {
      return NextResponse.json({ error: 'Nenhum profissional aceito' }, { status: 400 });
    }

    // Valor = proposta aceita
    const proposal = await supabase
      .from('proposals')
      .select('amount')
      .eq('request_id', request_id)
      .eq('status', 'aceita')
      .single();
    const amount = proposal.data?.amount ?? request.budget ?? 0;
    const fee = Math.round(amount * FEE);
    const total = Math.round((amount + fee) * 100) / 100;

    // Perfil para dados do pagador
    const profile = await supabase.from('profiles').select('*').eq('id', user.id).single();

    const admin = createAdminClient();

    const externalReference = `req_${request_id}`;

    let paymentInfo;
    let record: { method: string; mp_payment_id?: string; mp_preference?: unknown };

    if (method === 'pix') {
      const mp = await createPixPayment({
        amount: total,
        description: `FazzyPro · ${request.title}`,
        externalReference,
        payerEmail: profile.data?.email || user.email!,
        payerName: profile.data?.name || 'Cliente',
      });
      paymentInfo = mp;
      record = { method: 'pix', mp_payment_id: String(mp.id) };
    } else {
      const pref = await createCheckoutPreference({
        amount: total,
        title: `FazzyPro · ${request.title}`,
        externalReference,
        payerEmail: profile.data?.email || user.email!,
      });
      paymentInfo = pref;
      record = { method: 'credit_card', mp_preference: { id: pref.id, init_point: pref.init_point } };
    }

    // Persistência (admin ignora RLS)
    const { data: payment, error: payErr } = await admin
      .from('payments')
      .insert({
        request_id,
        amount,
        fee,
        total,
        status: 'pending',
        method: record.method,
        ...(record.mp_payment_id ? { mp_payment_id: record.mp_payment_id } : {}),
        ...(record.mp_preference ? { mp_preference: record.mp_preference } : {}),
      })
      .select('*')
      .single();
    if (payErr) throw payErr;

    return NextResponse.json({ payment, info: paymentInfo, amount, fee, total });
  } catch (e: any) {
    console.error('create-payment error', e);
    return NextResponse.json({ error: e.message || 'Erro ao criar pagamento' }, { status: 500 });
  }
}
