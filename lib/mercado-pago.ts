// =========================================================
// Integração Mercado Pago (server-side — USAR SOMENTE NO SERVIDOR)
// Docs: https://www.mercadopago.com.br/developers/pt
// =========================================================

const MP_BASE = 'https://api.mercadopago.com';

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN!}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Cria um pagamento Pix e retorna os dados de pagamento.
 * Em produção, use a URL do QR code (point_of_interaction) para o cliente escanear.
 */
export async function createPixPayment(opts: {
  amount: number;
  description: string;
  externalReference: string;
  payerEmail: string;
  payerName: string;
}): Promise<MpPayment> {
  const body = {
    transaction_amount: opts.amount,
    description: opts.description,
    payment_method_id: 'pix',
    external_reference: opts.externalReference,
    payer: {
      email: opts.payerEmail,
      first_name: opts.payerName,
    },
    notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercado-pago/webhook`,
  };

  return mpRequest<MpPayment>('/v1/payments', 'POST', body);
}

/**
 * Cria uma preferência de checkout (pagamento via cartão / "Mercado Pago").
 * Retorna a URL que redireciona o cliente para o checkout do Mercado Pago.
 */
export async function createCheckoutPreference(opts: {
  amount: number;
  title: string;
  externalReference: string;
  payerEmail: string;
}): Promise<{ init_point: string; id: string }> {
  const body = {
    items: [
      {
        title: opts.title,
        quantity: 1,
        unit_price: opts.amount,
        currency_id: 'BRL',
      },
    ],
    external_reference: opts.externalReference,
    back_urls: {
      success: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      failure: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=failure`,
      pending: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=pending`,
    },
    auto_return: 'approved',
    payer: { email: opts.payerEmail },
    notification_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/mercado-pago/webhook`,
  };

  return mpRequest<{ init_point: string; id: string }>('/checkout/preferences', 'POST', body);
}

/**
 * Consulta um pagamento pelo id (para confirmar status no webhook ou manualmente).
 */
export async function getPayment(paymentId: string): Promise<MpPayment> {
  return mpRequest<MpPayment>(`/v1/payments/${paymentId}`, 'GET');
}

async function mpRequest<T>(path: string, method: 'GET' | 'POST', body?: unknown): Promise<T> {
  const res = await fetch(`${MP_BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = (json as any)?.message || `Erro ${res.status} no Mercado Pago`;
    throw new Error(msg);
  }
  return json as T;
}

export interface MpPayment {
  id: string | number;
  status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'in_process' | string;
  transaction_amount: number;
  external_reference: string | null;
  payment_method_id?: string;
  point_of_interaction?: {
    transaction_data?: { qr_code_base64?: string; qr_code?: string; ticket_url?: string };
  };
  payer?: { email?: string };
}

export const MP_STATUS_MAP: Record<string, string> = {
  approved: 'approved',
  pending: 'pending',
  in_process: 'pending',
  rejected: 'rejected',
  refunded: 'refunded',
};
