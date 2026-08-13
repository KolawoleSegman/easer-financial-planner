import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { initializeTransaction, premiumAmountKobo, premiumCurrency } from "@/lib/paystack";
import { rateLimit, getIp, audit } from "@/lib/security";
import crypto from "crypto";

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (u.plan === "PREMIUM" || u.plan === "ADMIN") {
    return NextResponse.json({ error: "Already premium" }, { status: 409 });
  }

  const rl = rateLimit(`pay:${u.id}:${getIp(req)}`, 5, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many payment attempts." }, { status: 429 });
  }

  // NEVER accept amount from the client — server owns the price
  const amount = premiumAmountKobo();
  const currency = premiumCurrency();
  const reference = `easer_${u.id.slice(0, 8)}_${crypto.randomBytes(8).toString("hex")}`;
  const callback = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`;

  try {
    const d = await initializeTransaction(
      u.email,
      amount,
      callback,
      {
        userId: u.id,
        product: "premium",
        expectedAmount: amount,
        expectedCurrency: currency,
      },
      reference
    );
    await audit(u.id, "PAYMENT_INIT", { reference: d.reference, amount, currency });
    return NextResponse.json({
      authorizationUrl: d.authorization_url,
      reference: d.reference,
      amount,
      currency,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment initialization failed" },
      { status: 500 }
    );
  }
}
