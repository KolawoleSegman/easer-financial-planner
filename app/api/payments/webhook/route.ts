import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { premiumAmountKobo, premiumCurrency } from "@/lib/paystack";
import { safeEqual, audit } from "@/lib/security";

export async function POST(req: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";
  const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");

  if (!signature || !safeEqual(signature, expected)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad payload" }, { status: 400 });
  }

  const d = event.data;
  const eventType = String(event.event || "");
  const reference = String(d?.reference || "");
  const eventId = eventType && reference ? `${eventType}:${reference}` : null;

  // Idempotency by event id / reference
  if (eventId) {
    const seen = await db.paymentEvent.findFirst({
      where: { OR: [{ eventId }, { reference: reference || "___none___" }] },
    });
    if (seen && seen.status === "success") {
      return NextResponse.json({ received: true, duplicate: true });
    }
  }

  try {
    if (eventType === "charge.success" && reference) {
      const userId = d?.metadata?.userId as string | undefined;
      if (!userId) {
        return NextResponse.json({ received: true, ignored: "no userId" });
      }

      const expectedAmount = premiumAmountKobo();
      const expectedCurrency = premiumCurrency();
      if (Number(d.amount) !== expectedAmount) {
        await audit(userId, "WEBHOOK_AMOUNT_MISMATCH", {
          reference,
          paid: d.amount,
          expected: expectedAmount,
        });
        return NextResponse.json({ received: true, ignored: "amount" });
      }
      if (String(d.currency || "").toUpperCase() !== expectedCurrency.toUpperCase()) {
        await audit(userId, "WEBHOOK_CURRENCY_MISMATCH", { reference });
        return NextResponse.json({ received: true, ignored: "currency" });
      }

      await db.$transaction(async (tx) => {
        await tx.paymentEvent.upsert({
          where: { reference },
          create: {
            userId,
            eventId: eventId || undefined,
            reference,
            eventType,
            amount: d.amount,
            currency: d.currency,
            status: "success",
            rawSummary: { event: eventType, channel: d.channel },
          },
          update: {
            eventId: eventId || undefined,
            status: "success",
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { plan: "PREMIUM" },
        });

        const existingSub = await tx.subscription.findFirst({
          where: { userId, reference },
        });
        if (!existingSub) {
          await tx.subscription.create({
            data: {
              userId,
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

      await audit(userId, "PREMIUM_PURCHASE", { reference, amount: d.amount, source: "webhook" });
    }

    // Lifecycle hooks for future subscription products
    if (
      eventType === "subscription.disable" ||
      eventType === "subscription.not_renew" ||
      eventType === "invoice.payment_failed"
    ) {
      const code = d?.subscription_code || d?.subscription?.subscription_code;
      if (code) {
        await db.subscription.updateMany({
          where: { providerSubscriptionCode: code },
          data: { status: "cancelled" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Bad webhook" }, { status: 400 });
  }
}
