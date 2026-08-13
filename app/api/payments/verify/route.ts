import { NextResponse } from "next/server";
import { verifyTransaction, premiumAmountKobo, premiumCurrency } from "@/lib/paystack";
import { db } from "@/lib/db";
import { audit } from "@/lib/security";

export async function POST(req: Request) {
  const reference = new URL(req.url).searchParams.get("reference");

  if (!reference || reference.length < 8 || reference.length > 100) {
    return NextResponse.json(
      { error: "Missing or invalid reference" },
      { status: 400 }
    );
  }

  try {
    /*
     * Verify the transaction directly with Paystack.
     * Do NOT depend on the browser session here.
     */
    const d = await verifyTransaction(reference);

    if (d.status !== "success") {
      return NextResponse.json(
        { error: "Payment has not been completed successfully." },
        { status: 400 }
      );
    }

    /*
     * Get the user from Paystack metadata.
     */
    const metaUserId = d.metadata?.userId;

    if (!metaUserId || typeof metaUserId !== "string") {
      return NextResponse.json(
        { error: "Payment is missing user information." },
        { status: 400 }
      );
    }

    /*
     * Verify the amount against the server-side price.
     */
    const expectedAmount = premiumAmountKobo();
    const expectedCurrency = premiumCurrency();

    if (Number(d.amount) !== expectedAmount) {
      await audit(metaUserId, "PAYMENT_AMOUNT_MISMATCH", {
        reference,
        paid: d.amount,
        expected: expectedAmount,
      });

      return NextResponse.json(
        { error: "Payment amount mismatch." },
        { status: 400 }
      );
    }

    /*
     * Verify currency.
     */
    if (
      String(d.currency || "").toUpperCase() !==
      expectedCurrency.toUpperCase()
    ) {
      await audit(metaUserId, "PAYMENT_CURRENCY_MISMATCH", {
        reference,
        paid: d.currency,
        expected: expectedCurrency,
      });

      return NextResponse.json(
        { error: "Payment currency mismatch." },
        { status: 400 }
      );
    }

    /*
     * Make the payment fulfillment atomic.
     */
    await db.$transaction(async (tx) => {
      /*
       * Record payment event.
       */
      await tx.paymentEvent.upsert({
        where: {
          reference,
        },
        create: {
          userId: metaUserId,
          reference,
          eventType: "verify",
          amount: d.amount,
          currency: d.currency,
          status: "success",
          rawSummary: {
            status: d.status,
            channel: d.channel,
          },
        },
        update: {
          status: "success",
        },
      });

      /*
       * Upgrade user to PREMIUM.
       */
      await tx.user.update({
        where: {
          id: metaUserId,
        },
        data: {
          plan: "PREMIUM",
        },
      });

      /*
       * Create subscription record if it does not already exist.
       */
      const existingSub = await tx.subscription.findFirst({
        where: {
          userId: metaUserId,
          reference,
        },
      });

      if (!existingSub) {
        await tx.subscription.create({
          data: {
            userId: metaUserId,
            provider: "paystack",
            status: "active",
            amount: d.amount,
            currency: d.currency,
            reference,
            providerCustomerCode:
              d.customer?.customer_code || null,
          },
        });
      }
    });

    /*
     * Audit successful purchase.
     */
    await audit(metaUserId, "PREMIUM_PURCHASE", {
      reference,
      amount: d.amount,
      source: "verify",
    });

    return NextResponse.json({
      ok: true,
      plan: "PREMIUM",
      reference,
    });
  } catch (error) {
    console.error("PAYMENT VERIFICATION ERROR:", error);

    return NextResponse.json(
      {
        error: "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}