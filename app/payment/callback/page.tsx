"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying payment…");
  const [error, setError] = useState("");
  const verified = useRef(false);

  useEffect(() => {
    if (verified.current) return;

    const ref =
      params.get("reference") ||
      params.get("trxref");

    if (!ref) {
      setStatus("Missing payment reference.");
      setError(
        "Paystack did not return a valid transaction reference."
      );
      return;
    }

    verified.current = true;

    const verifyPayment = async () => {
      try {
        setStatus("Verifying your payment…");

        const response = await fetch(
          `/api/payments/verify?reference=${encodeURIComponent(ref)}`,
          {
            method: "POST",
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          setStatus("Payment verification failed.");
          setError(
            data?.error ||
              "We could not verify your payment. Please contact support."
          );
          return;
        }

        setStatus(
          "Payment successful! Your Premium plan is now active."
        );

        setTimeout(() => {
          router.replace("/dashboard");
        }, 1000);
      } catch (err) {
        console.error("Payment verification error:", err);

        setStatus("Payment verification failed.");
        setError(
          "We could not connect to the payment verification service."
        );
      }
    };

    verifyPayment();
  }, [params, router]);

  return (
    <div className="card w-full max-w-md p-8 text-center">
      <h1 className="text-2xl font-black text-[#102033]">
        {status}
      </h1>

      {error && (
        <p className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}

      {!error && (
        <p className="mt-3 text-sm text-gray-600">
          Please do not close this page while we verify your
          transaction.
        </p>
      )}
    </div>
  );
}

export default function CallbackPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F8FC] p-4">
      <Suspense
        fallback={
          <p className="text-gray-600">
            Loading payment verification…
          </p>
        }
      >
        <CallbackInner />
      </Suspense>
    </main>
  );
}