"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function Form() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json();
      if (r.ok) {
        setMsg("Password updated. You can sign in.");
        setTimeout(() => router.push("/login"), 1200);
      } else {
        setMsg(d.error || "Reset failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="text-2xl font-black text-[#102033]">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="password">
            New password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            minLength={10}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500">
            At least 10 characters, with upper, lower, and a number.
          </p>
        </div>
        {msg && <div className="alert-info">{msg}</div>}
        <button className="btn-primary w-full" disabled={loading || !token} type="submit">
          {loading ? "Saving…" : "Update password"}
        </button>
      </form>
      <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-[#0B5ED7]">
        Back to sign in
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F8FC] p-4">
      <Suspense fallback={<p>Loading…</p>}>
        <Form />
      </Suspense>
    </main>
  );
}
