"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Wallet,
  Target,
  CreditCard,
  CircleDollarSign,
  ShieldCheck,
  Gauge,
  Plus,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { analyse, money, monthlyGoalContribution, type Expense, type Goal } from "@/lib/finance";

type User = {
  id: string;
  name?: string | null;
  email: string;
  currency?: string;
  plan: string;
};

export default function Dashboard({ initialUser }: { initialUser: User }) {
  const [user, setUser] = useState(initialUser);
  const [income, setIncome] = useState(0);
  const [savings, setSavings] = useState(0);
  const [currency, setCurrency] = useState(initialUser.currency || "₦");
  const [expenses, setExpenses] = useState<(Expense & { id?: string })[]>([]);
  const [goals, setGoals] = useState<(Goal & { id?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [payLoading, setPayLoading] = useState(false);

  const a = useMemo(() => analyse(income, expenses, savings), [income, expenses, savings]);
  const symbol = currency === "NGN" || currency === "₦" ? "₦" : currency;

  async function load() {
    setLoading(true);
    try {
      const [p, e, g] = await Promise.all([
        fetch("/api/plan"),
        fetch("/api/expenses"),
        fetch("/api/goals"),
      ]);
      const pd = await p.json();
      const ed = await e.json();
      const gd = await g.json();
      if (pd.plan) {
        setIncome(pd.plan.income);
        setSavings(pd.plan.savings);
        setCurrency(pd.plan.currency === "NGN" ? "₦" : pd.plan.currency);
      }
      setExpenses(ed.expenses || []);
      setGoals(gd.goals || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function savePlan() {
    setMsg("");
    const r = await fetch("/api/plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        income: Math.round(income),
        savings: Math.round(savings),
        currency: currency === "₦" ? "NGN" : currency,
      }),
    });
    setMsg(r.ok ? "Plan saved." : "Could not save plan.");
  }

  async function updateExpense(id: string, amount: number) {
    setExpenses((x) => x.map((e) => (e.id === id ? { ...e, amount } : e)));
    const current = expenses.find((e) => e.id === id);
    await fetch("/api/expenses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        amount: Math.round(amount),
        essential: current?.essential,
      }),
    });
  }

  async function addExpense() {
    const name = prompt("Expense name");
    if (!name) return;
    const amount = Number(prompt("Monthly amount") || 0);
    if (!Number.isFinite(amount) || amount < 0) return;
    const e = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount: Math.round(amount),
        essential: true,
        month: new Date().toISOString().slice(0, 7),
      }),
    });
    if (e.ok) load();
  }

  async function delExpense(id: string) {
    await fetch("/api/expenses?id=" + encodeURIComponent(id), { method: "DELETE" });
    load();
  }

  async function addGoal() {
    const name = prompt("Goal name");
    if (!name) return;
    const target = Number(prompt("Target amount") || 0);
    const months = Number(prompt("Months") || 12);
    const saved = Number(prompt("Already saved") || 0);
    if (!Number.isFinite(target) || target < 1) return;
    const r = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        target: Math.round(target),
        months: Math.max(1, Math.round(months)),
        saved: Math.max(0, Math.round(saved)),
      }),
    });
    if (r.ok) load();
  }

  async function delGoal(id: string) {
    await fetch("/api/goals?id=" + encodeURIComponent(id), { method: "DELETE" });
    load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function upgrade() {
    setPayLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/payments/initialize", { method: "POST" });
      const d = await r.json();
      if (d.authorizationUrl) {
        window.location.href = d.authorizationUrl;
      } else {
        setMsg(d.error || "Could not start payment.");
      }
    } finally {
      setPayLoading(false);
    }
  }

  async function deleteAccount() {
    if (
      !confirm(
        "This will permanently delete your account and financial data. Continue?"
      )
    )
      return;
    const confirmText = prompt('Type "DELETE MY ACCOUNT" to confirm');
    if (confirmText !== "DELETE MY ACCOUNT") return;
    const r = await fetch("/api/me", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE MY ACCOUNT" }),
    });
    if (r.ok) window.location.href = "/";
    else setMsg("Could not delete account.");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F5F8FC]">
        <p className="text-slate-500" role="status">
          Loading your plan…
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8FC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#0B5ED7] font-black text-white">
              E
            </div>
            <div>
              <p className="font-bold text-[#102033]">Easer Financial Planner</p>
              <p className="text-xs text-slate-500">
                {user.name || user.email}
                {user.plan === "PREMIUM" || user.plan === "ADMIN" ? (
                  <span className="badge-premium ml-2">Premium</span>
                ) : (
                  <span className="badge-free ml-2">Free</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.plan === "FREE" && (
              <button
                type="button"
                className="btn-primary"
                onClick={upgrade}
                disabled={payLoading}
              >
                <CreditCard className="h-4 w-4" aria-hidden />
                {payLoading ? "Starting…" : "Upgrade"}
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={logout}>
              <LogOut className="h-4 w-4" aria-hidden />
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {msg && (
          <div className="alert-info" role="status">
            {msg}
          </div>
        )}

        {/* Snapshot cards */}
        <section aria-label="Financial snapshot" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Wallet className="h-4 w-4 text-[#0B5ED7]" aria-hidden />
              Income
            </div>
            <p className="mt-2 text-2xl font-black text-[#102033]">
              {money(income, symbol)}
            </p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <CircleDollarSign className="h-4 w-4 text-[#0B5ED7]" aria-hidden />
              Spending
            </div>
            <p className="mt-2 text-2xl font-black text-[#102033]">
              {money(a.totalExpenses, symbol)}
            </p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <ShieldCheck className="h-4 w-4 text-[#0B5ED7]" aria-hidden />
              Available
            </div>
            <p
              className={`mt-2 text-2xl font-black ${
                a.remaining < 0 ? "text-[#D62828]" : "text-[#102033]"
              }`}
            >
              {money(a.remaining, symbol)}
            </p>
          </div>
          <div className="card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
              <Gauge className="h-4 w-4 text-[#0B5ED7]" aria-hidden />
              Health score
            </div>
            <p className="mt-2 text-2xl font-black text-[#102033]">{a.score}/100</p>
          </div>
        </section>

        {/* Income / savings form */}
        <section className="card p-6" aria-labelledby="plan-heading">
          <h2 id="plan-heading" className="text-lg font-bold text-[#102033]">
            Your monthly plan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Guidance only — not regulated financial advice.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="income">
                Monthly income
              </label>
              <input
                id="income"
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                value={income || ""}
                onChange={(e) => setIncome(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="label" htmlFor="savings">
                Current savings
              </label>
              <input
                id="savings"
                className="input"
                type="number"
                min={0}
                inputMode="numeric"
                value={savings || ""}
                onChange={(e) => setSavings(Number(e.target.value) || 0)}
              />
            </div>
            <div className="flex items-end">
              <button type="button" className="btn-primary w-full" onClick={savePlan}>
                Save plan
              </button>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section aria-label="Budget alerts" className="space-y-2">
          {a.alerts.map((alert) => (
            <div key={alert} className="alert-warn flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{alert}</span>
            </div>
          ))}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Expenses */}
          <section className="card p-6" aria-labelledby="expenses-heading">
            <div className="flex items-center justify-between gap-2">
              <h2 id="expenses-heading" className="text-lg font-bold text-[#102033]">
                Expenses
              </h2>
              <button type="button" className="btn-secondary" onClick={addExpense}>
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {expenses.length === 0 && (
                <li className="text-sm text-slate-500">No expenses yet. Add your first one.</li>
              )}
              {expenses.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2">
                  <span className="min-w-[8rem] flex-1 text-sm font-medium text-slate-800">
                    {e.name}
                    {e.essential && (
                      <span className="ml-1 text-xs text-slate-400">(essential)</span>
                    )}
                  </span>
                  <input
                    className="input max-w-[9rem]"
                    type="number"
                    min={0}
                    aria-label={`Amount for ${e.name}`}
                    value={e.amount || ""}
                    onChange={(ev) =>
                      updateExpense(e.id!, Number(ev.target.value) || 0)
                    }
                  />
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-[#D62828]"
                    aria-label={`Delete ${e.name}`}
                    onClick={() => delExpense(e.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Goals */}
          <section className="card p-6" aria-labelledby="goals-heading">
            <div className="flex items-center justify-between gap-2">
              <h2 id="goals-heading" className="flex items-center gap-2 text-lg font-bold text-[#102033]">
                <Target className="h-5 w-5 text-[#0B5ED7]" aria-hidden />
                Savings goals
              </h2>
              <button type="button" className="btn-secondary" onClick={addGoal}>
                <Plus className="h-4 w-4" aria-hidden />
                Add
              </button>
            </div>
            <ul className="mt-4 space-y-4">
              {goals.length === 0 && (
                <li className="text-sm text-slate-500">No goals yet. Set a target to save toward.</li>
              )}
              {goals.map((g) => {
                const monthly = monthlyGoalContribution(g.target, g.saved, g.months);
                const pct =
                  g.target > 0
                    ? Math.min(100, Math.round((g.saved / g.target) * 100))
                    : 0;
                return (
                  <li key={g.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#102033]">{g.name}</p>
                        <p className="text-sm text-slate-500">
                          {money(g.saved, symbol)} of {money(g.target, symbol)} ·{" "}
                          {money(monthly, symbol)}/mo
                        </p>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-[#D62828]"
                        aria-label={`Delete goal ${g.name}`}
                        onClick={() => delGoal(g.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div
                      className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${g.name} progress ${pct}%`}
                    >
                      <div
                        className="h-full rounded-full bg-[#0B5ED7]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Recommendations */}
        <section className="card p-6" aria-labelledby="rec-heading">
          <h2 id="rec-heading" className="text-lg font-bold text-[#102033]">
            Suggested allocation
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Illustrative guidelines based on your income — not guarantees.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                ["Essentials", a.recommended.essentials],
                ["Savings", a.recommended.savings],
                ["Emergency", a.recommended.emergency],
                ["Investment", a.recommended.investment],
                ["Lifestyle", a.recommended.lifestyle],
                ["Buffer", a.recommended.buffer],
              ] as const
            ).map(([label, val]) => (
              <div key={label} className="rounded-xl bg-[#F5F8FC] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {label}
                </p>
                <p className="mt-1 font-bold text-[#102033]">{money(val, symbol)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Emergency fund target (3× essentials):{" "}
            <strong>{money(a.emergencyTarget, symbol)}</strong>
            {a.monthsToEmergency !== null && (
              <> · ~{a.monthsToEmergency} months at current free cash</>
            )}
          </p>
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-bold text-[#102033]">Account</h2>
          <p className="mt-1 text-sm text-slate-500">
            You can delete your account and associated personal financial data.
          </p>
          <button type="button" className="btn-danger mt-4" onClick={deleteAccount}>
            Delete my account
          </button>
        </section>

        <p className="pb-8 text-center text-xs text-slate-400">
          Easer provides planning tools and educational guidance only. It is not a bank,
          investment adviser, or regulated financial product.{" "}
          <a href="/disclaimer" className="text-[#0B5ED7] underline">
            Read the disclaimer
          </a>
          .
        </p>
      </div>
    </main>
  );
}
