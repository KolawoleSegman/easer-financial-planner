"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function CallbackInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Verifying payment…");

  useEffect(() => {
    const ref = params.get("reference");
    if (!ref) {
      setStatus("Missing payment reference.");
      return;
    }
    fetch("/api/payments/verify?reference=" + encodeURIComponent(ref), {
      method: "POST",
    })
      .then((x) => x.json())
      .then((d) => {
        setStatus(
          d.ok
            ? "Payment successful. Premium is active."
            : d.error || "Payment could not be verified."
        );
        if (d.ok) setTimeout(() => router.push("/dashboard"), 1200);
      })
      .catch(() => setStatus("Verification failed."));
  }, [params, router]);

  return (
    <div className="card p-8 text-center">
      <h1 className="text-2xl font-black text-[#102033]">{status}</h1>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F8FC] p-4">
      <Suspense fallback={<p>Loading…</p>}>
        <CallbackInner />
      </Suspense>
    </main>
  );
}
