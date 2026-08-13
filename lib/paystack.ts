const base = "https://api.paystack.co";

/** Premium product price in kobo (default ₦2,500.00). Override with PAYSTACK_PREMIUM_AMOUNT_KOBO. */
export function premiumAmountKobo(): number {
  const fromEnv = process.env.PAYSTACK_PREMIUM_AMOUNT_KOBO;
  if (fromEnv) {
    const n = Number(fromEnv);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return 250000;
}

export function premiumCurrency(): string {
  return process.env.PAYSTACK_PREMIUM_CURRENCY || "NGN";
}

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

async function call(path: string, init: RequestInit = {}) {
  const r = await fetch(base + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = await r.json();
  if (!r.ok || data.status === false) {
    throw new Error(data.message || "Paystack request failed");
  }
  return data.data;
}

export function initializeTransaction(
  email: string,
  amountKobo: number,
  callbackUrl: string,
  metadata: Record<string, unknown>,
  reference?: string
) {
  return call("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email,
      amount: amountKobo,
      currency: premiumCurrency(),
      callback_url: callbackUrl,
      metadata,
      ...(reference ? { reference } : {}),
    }),
  });
}

export function verifyTransaction(reference: string) {
  return call(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function disableSubscription(code: string, token: string) {
  return call("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({ code, token }),
  });
}

export function listPlans() {
  return call("/plan");
}
