import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { verifyTransaction, premiumAmountKobo, premiumCurrency } from "@/lib/paystack";
import { db } from "@/lib/db";
import { audit } from "@/lib/security";

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reference = new URL(req.url).searchParams.get("reference");
  if (!reference || reference.length < 8 || reference.length > 100) {
    return NextResponse.json({ error: "Missing or invalid reference" }, { status: 400 });
  }

  try {
    // Idempotency: already processed?
    const existing = await db.paymentEvent.findUnique({ where: { reference } });
    if (existing && existing.status === "success") {
      return NextResponse.json({ ok: true, alreadyProcessed: true });
    }

    const d = await verifyTransaction(reference);
    if (d.status !== "success") {
      return NextResponse.json({ error: "Payment not successful" }, { status: 400 });
    }

    // Ownership
    const metaUserId = d.metadata?.userId;
    if (metaUserId !== u.id) {
      await audit(u.id, "PAYMENT_OWNERSHIP_MISMATCH", { reference });
      return NextResponse.json({ error: "Payment ownership mismatch" }, { status: 403 });
    }

    // Amount & currency must match server-side product price
    const expectedAmount = premiumAmountKobo();
    const expectedCurrency = premiumCurrency();
    if (Number(d.amount) !== expectedAmount) {
      await audit(u.id, "PAYMENT_AMOUNT_MISMATCH", {
        reference,
        paid: d.amount,
        expected: expectedAmount,
      });
      return NextResponse.json({ error: "Payment amount mismatch" }, { status: 400 });
    }
    if (String(d.currency || "").toUpperCase() !== expectedCurrency.toUpperCase()) {
      await audit(u.id, "PAYMENT_CURRENCY_MISMATCH", { reference, paid: d.currency });
      return NextResponse.json({ error: "Payment currency mismatch" }, { status: 400 });
    }

    await db.$transaction(async (tx) => {
      await tx.paymentEvent.upsert({
        where: { reference },
        create: {
          userId: u.id,
          reference,
          eventType: "verify",
          amount: d.amount,
          currency: d.currency,
          status: "success",
          rawSummary: { status: d.status, channel: d.channel },
        },
        update: { status: "success" },
      });

      await tx.user.update({
        where: { id: u.id },
        data: { plan: "PREMIUM" },
      });

      const existingSub = await tx.subscription.findFirst({
        where: { userId: u.id, reference },
      });
      if (!existingSub) {
        await tx.subscription.create({
          data: {
            userId: u.id,
            provider: "paystack",
            status: "active",
            amount: d.amount,
            currency: d.currency,
            reference,
            providerCustomerCode: d.customer?.customer_code || null,
          },
        });
      }
    });

    await audit(u.id, "PREMIUM_PURCHASE", { reference, amount: d.amount, source: "verify" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
