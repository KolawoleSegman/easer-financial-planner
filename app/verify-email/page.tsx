"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function Verify() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [msg, setMsg] = useState("Verifying…");

  useEffect(() => {
    if (!token) {
      setMsg("Missing verification token.");
      return;
    }
    fetch("/api/auth/verify-email?token=" + encodeURIComponent(token), {
      method: "POST",
    })
      .then((r) => r.json())
      .then((d) => setMsg(d.ok ? "Email verified. You can use your account." : d.error || "Failed"))
      .catch(() => setMsg("Verification failed."));
  }, [token]);

  return (
    <div className="card w-full max-w-md p-8 text-center">
      <h1 className="text-2xl font-black text-[#102033]">{msg}</h1>
      <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
        Go to dashboard
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F8FC] p-4">
      <Suspense fallback={<p>Loading…</p>}>
        <Verify />
      </Suspense>
    </main>
  );
}
