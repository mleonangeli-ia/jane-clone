const MP_BASE = "https://api.mercadopago.com";

function headers() {
  return {
    Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export type MpPreferenceInput = {
  items: { id: string; title: string; description: string; quantity: number; unit_price: number; currency_id: string }[];
  payer: { name: string; email: string };
  external_reference: string;
  back_urls: { success: string; failure: string; pending: string };
  auto_return: string;
  notification_url: string;
  statement_descriptor: string;
};

export async function createPreference(body: MpPreferenceInput) {
  const res = await fetch(`${MP_BASE}/checkout/preferences`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`MP preference error: ${res.status}`);
  return res.json() as Promise<{ id: string; init_point: string; sandbox_init_point: string }>;
}

export async function getPayment(id: string) {
  const res = await fetch(`${MP_BASE}/v1/payments/${id}`, { headers: headers() });
  if (!res.ok) throw new Error(`MP payment error: ${res.status}`);
  return res.json() as Promise<{
    id: number;
    status: string;
    external_reference: string;
    transaction_amount: number;
    currency_id: string;
  }>;
}
