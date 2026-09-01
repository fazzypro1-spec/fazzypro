import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPayment, MP_STATUS_MAP } from '@/lib/mercado-pago';

export const runtime = 'nodejs';

// Webhook do Mercado Pago — confirma o status do pagamento.
// O Mercado Pago envia POST para /api/mercado-pago/webhook?data.id=PAYMENT_ID
export async function POST(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('data.id') || url.searchParams.get('id');

  if (!id) return NextResponse.json({ ok: false, error: 'sem id' }, { status: 400 });

  try {
    // Consulta o pagamento no Mercado Pago para o status oficial
    const mp = await getPayment(id);
    const status = MP_STATUS_MAP[mp.status] || 'pending';
    const externalRef = mp.external_reference; // formato "req_<request_id>"

    const admin = createAdminClient();
    const requestId = externalRef?.startsWith('req_') ? externalRef.slice(4) : null;

    // Atualiza o pagamento
    await admin.from('payments').update({ status, mp_payment_id: String(mp.id) }).eq('mp_payment_id', String(mp.id));

    if (requestId && status === 'approved') {
      // Marca o pedido como concluído e oculta o botão de pagar
      const { data: payment } = await admin
        .from('payments')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const request = await admin.from('requests').select('*').eq('id', requestId).single();

      await admin.from('requests').update({ status: 'concluida', pay_method: payment?.method }).eq('id', requestId);

      if (request.data) {
        // Notifica o profissional
        await admin.from('notifications').insert({
          user_id: request.data.accepted_pro,
          text: `Pagamento aprovado (${request.data.title}). Compartilhamento pronto.`,
          icon: 'money',
        });
        // Notifica o cliente
        await admin.from('notifications').insert({
          user_id: request.data.client_id,
          text: `Pagamento confirmado · ${request.data.title}. Obrigado!`,
          icon: 'check',
        });
      }
    }

    return NextResponse.json({ ok: true, status });
  } catch (e: any) {
    console.error('webhook error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
