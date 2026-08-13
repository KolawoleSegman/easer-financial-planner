"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      setMsg(d.message || d.error || "Request processed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F8FC] p-4">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-black text-[#102033]">Reset password</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and we will send a reset link if an account exists.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {msg && <div className="alert-info">{msg}</div>}
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-[#0B5ED7]">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
