"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const path = register ? "/api/auth/register" : "/api/auth/login";
      const body = register ? { name, email, password } : { email, password };
      const r = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Something went wrong.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F5F8FC] p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <div
            className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#0B5ED7] text-xl font-black text-white"
            aria-hidden
          >
            E
          </div>
          <h1 className="mt-4 text-2xl font-black text-[#102033]">
            {register ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Easer Financial Planner</p>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          {register && (
            <div>
              <label className="label" htmlFor="name">
                Name
              </label>
              <input
                id="name"
                className="input"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              className="input"
              type="password"
              minLength={register ? 10 : 8}
              required
              autoComplete={register ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {register && (
              <p className="mt-1 text-xs text-slate-500">
                At least 10 characters, with upper, lower, and a number.
              </p>
            )}
          </div>
          {error && (
            <div className="alert-warn" role="alert">
              {error}
            </div>
          )}
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Please wait…" : register ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="mt-5 w-full text-sm font-semibold text-[#0B5ED7]"
          onClick={() => {
            setRegister(!register);
            setError("");
          }}
        >
          {register ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>

        {!register && (
          <p className="mt-4 text-center text-sm">
            <Link href="/forgot-password" className="font-semibold text-slate-600 hover:text-[#0B5ED7]">
              Forgot password?
            </Link>
          </p>
        )}
      </div>
    </main>
  );
}
