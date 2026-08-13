 "use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, ChevronRight, CircleDollarSign, CreditCard, Gauge, PiggyBank, ShieldCheck, Sparkles, Target, Wallet, X } from "lucide-react";
import { analyse, affordability, defaultExpenses, money, type Expense, type Goal } from "@/lib/finance";

const STORAGE = "easer-financial-planner-v1";

export default function Planner() {
  const [income, setIncome] = useState(500000);
  const [savings, setSavings] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>(defaultExpenses);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalSaved, setGoalSaved] = useState("");
  const [goalMonths, setGoalMonths] = useState("12");
  const [purchase, setPurchase] = useState("");
  const [purchaseResult, setPurchaseResult] = useState<{status:string;detail:string}|null>(null);
  const [active, setActive] = useState("overview");
  const [currency, setCurrency] = useState("₦");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const d = JSON.parse(raw);
        setIncome(d.income ?? 500000); setSavings(d.savings ?? 0); setExpenses(d.expenses ?? defaultExpenses);
        setGoals(d.goals ?? []); setCurrency(d.currency ?? "₦");
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE, JSON.stringify({income, savings, expenses, goals, currency}));
  }, [income, savings, expenses, goals, currency, loaded]);

  const a = useMemo(() => analyse(income, expenses, savings), [income, expenses, savings]);

  function updateExpense(index:number, amount:number) {
    setExpenses(prev => prev.map((e,i) => i === index ? {...e, amount: Math.max(0, amount || 0)} : e));
  }

  function addGoal() {
    const target = Number(goalTarget), saved = Number(goalSaved), months = Number(goalMonths);
    if (!goalName.trim() || target <= 0 || months <= 0) return;
    setGoals(g => [...g, {name:goalName.trim(), target, saved:Math.max(0,saved), months}]);
    setGoalName(""); setGoalTarget(""); setGoalSaved(""); setGoalMonths("12");
  }

  function reset() {
    setIncome(0); setSavings(0); setExpenses(defaultExpenses); setGoals([]); setPurchase(""); setPurchaseResult(null);
  }

  const tabs = [
    ["overview","Overview",Gauge],["budget","Budget",Wallet],["goals","Goals",Target],["afford","Can I Afford It?",CircleDollarSign],["debt","Debt",CreditCard]
  ] as const;

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white font-black">E</div>
            <div><div className="font-extrabold text-slate-900">Easer Financial Planner</div><div className="text-xs text-slate-500">Make Every Naira Count.</div></div>
          </div>
          <button onClick={reset} className="btn-secondary text-sm">Reset plan</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="card h-fit p-3 lg:sticky lg:top-24">
          {tabs.map(([id,label,Icon]) => <button key={id} onClick={()=>setActive(id)} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${active===id?"bg-blue-50 text-blue-700":"text-slate-600 hover:bg-slate-50"}`}><Icon size={18}/>{label}</button>)}
          <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
            <Sparkles size={18} className="mb-2"/>
            <div className="text-sm font-bold">Financial health</div>
            <div className="mt-2 text-3xl font-black">{a.score}<span className="text-sm font-normal text-slate-400">/100</span></div>
          </div>
        </aside>

        <section>
          {active==="overview" && <Overview income={income} setIncome={setIncome} savings={savings} setSavings={setSavings} a={a} currency={currency} setCurrency={setCurrency} />}
          {active==="budget" && <Budget expenses={expenses} updateExpense={updateExpense} a={a} currency={currency} />}
          {active==="goals" && <Goals goals={goals} addGoal={addGoal} goalName={goalName} setGoalName={setGoalName} goalTarget={goalTarget} setGoalTarget={setGoalTarget} goalSaved={goalSaved} setGoalSaved={setGoalSaved} goalMonths={goalMonths} setGoalMonths={setGoalMonths} currency={currency} />}
          {active==="afford" && <Afford purchase={purchase} setPurchase={setPurchase} result={purchaseResult} setResult={()=>setPurchaseResult(affordability(income,expenses,Number(purchase),savings))} currency={currency} />}
          {active==="debt" && <Debt expenses={expenses} updateExpense={updateExpense} income={income} a={a} currency={currency} />}
        </section>
      </div>
    </main>
  );
}

function Overview({income,setIncome,savings,setSavings,a,currency,setCurrency}:any) {
  return <div className="space-y-6">
    <div><p className="text-sm font-semibold text-blue-600">YOUR PERSONAL PLAN</p><h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">Take control of your money.</h1><p className="mt-2 max-w-2xl text-slate-600">Enter your income and spending. Easer Financial Planner turns the numbers into a practical monthly plan.</p></div>
    <div className="grid gap-4 md:grid-cols-3">
      <div className="card p-5 md:col-span-2"><label className="label">Monthly income</label><div className="flex gap-2"><select value={currency} onChange={e=>setCurrency(e.target.value)} className="input w-28"><option>₦</option><option>$</option><option>£</option><option>€</option></select><input className="input text-2xl font-bold" type="number" min="0" value={income||""} onChange={e=>setIncome(Number(e.target.value))}/></div><label className="label mt-5">Current savings</label><input className="input" type="number" min="0" value={savings||""} onChange={e=>setSavings(Number(e.target.value))}/></div>
      <div className="rounded-2xl bg-blue-600 p-5 text-white"><ShieldCheck/><div className="mt-4 text-sm opacity-80">Financial Health</div><div className="text-5xl font-black">{a.score}</div><div className="mt-1 text-sm opacity-80">out of 100</div></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat title="Total expenses" value={money(a.totalExpenses,currency)} icon={Wallet}/>
      <Stat title="Available" value={money(a.remaining,currency)} icon={CircleDollarSign}/>
      <Stat title="Essentials" value={money(a.essentials,currency)} icon={ShieldCheck}/>
      <Stat title="Emergency target" value={money(a.emergencyTarget,currency)} icon={PiggyBank}/>
    </div>
    <div className="card p-6"><h2 className="text-xl font-extrabold">Your recommendations</h2><div className="mt-4 space-y-3">{a.alerts.map((x:string,i:number)=><div key={i} className="flex gap-3 rounded-xl bg-slate-50 p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-blue-600" size={20}/><p className="text-sm text-slate-700">{x}</p></div>)}</div></div>
    <div className="card p-6"><h2 className="text-xl font-extrabold">Suggested allocation</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(a.recommended).map(([k,v]:any)=><div key={k} className="rounded-xl border border-slate-200 p-4"><div className="text-sm capitalize text-slate-500">{k}</div><div className="mt-1 text-xl font-bold">{money(v,currency)}</div></div>)}</div></div>
  </div>
}

function Stat({title,value,icon:Icon}:any){return <div className="card p-5"><Icon size={19} className="text-blue-600"/><div className="mt-4 text-sm text-slate-500">{title}</div><div className="mt-1 text-2xl font-black">{value}</div></div>}

function Budget({expenses,updateExpense,a,currency}:any){
 return <div className="space-y-6"><div><h1 className="text-3xl font-black">Monthly budget</h1><p className="mt-1 text-slate-600">Add your real monthly costs. Your plan updates automatically.</p></div>
 <div className="card overflow-hidden"><div className="grid grid-cols-[1fr_150px] border-b bg-slate-50 px-5 py-3 text-xs font-bold uppercase text-slate-500"><span>Expense</span><span>Monthly amount</span></div>{expenses.map((e:Expense,i:number)=><div key={e.name} className="grid grid-cols-[1fr_150px] items-center gap-4 border-b px-5 py-3 last:border-0"><div><div className="font-semibold">{e.name}</div><div className="text-xs text-slate-500">{e.essential?"Essential":"Flexible"}</div></div><input className="input" type="number" min="0" value={e.amount||""} onChange={x=>updateExpense(i,Number(x.target.value))}/></div>)}</div>
 <div className="card p-6"><div className="flex justify-between"><span className="font-bold">Total expenses</span><strong>{money(a.totalExpenses,currency)}</strong></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600" style={{width:`${Math.min(100,a.expenseRate*100)}%`}}/></div><p className="mt-2 text-sm text-slate-500">{Math.round(a.expenseRate*100)}% of income is currently committed.</p></div></div>
}

function Goals({goals,addGoal,goalName,setGoalName,goalTarget,setGoalTarget,goalSaved,setGoalSaved,goalMonths,setGoalMonths,currency}:any){
 return <div className="space-y-6"><div><h1 className="text-3xl font-black">Savings goals</h1><p className="mt-1 text-slate-600">Turn the things you want into measurable targets.</p></div>
 <div className="card p-6"><div className="grid gap-4 md:grid-cols-4"><input className="input" placeholder="Goal name" value={goalName} onChange={e=>setGoalName(e.target.value)}/><input className="input" type="number" placeholder="Target" value={goalTarget} onChange={e=>setGoalTarget(e.target.value)}/><input className="input" type="number" placeholder="Already saved" value={goalSaved} onChange={e=>setGoalSaved(e.target.value)}/><input className="input" type="number" placeholder="Months" value={goalMonths} onChange={e=>setGoalMonths(e.target.value)}/></div><button className="btn-primary mt-4" onClick={addGoal}>Add goal</button></div>
 {goals.length===0?<div className="card p-8 text-center text-slate-500">No goals yet. Add your first financial goal above.</div>:<div className="grid gap-4 md:grid-cols-2">{goals.map((g:Goal,i:number)=>{const pct=Math.min(100,g.saved/g.target*100);const monthly=Math.max(0,(g.target-g.saved)/g.months);return <div className="card p-5" key={i}><div className="flex justify-between"><div className="font-extrabold">{g.name}</div><Target className="text-blue-600"/></div><div className="mt-4 text-2xl font-black">{money(g.saved,currency)} <span className="text-sm font-normal text-slate-400">/ {money(g.target,currency)}</span></div><div className="mt-3 h-3 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width:`${pct}%`}}/></div><div className="mt-3 text-sm text-slate-500">Save about <b>{money(monthly,currency)}</b> per month for {g.months} months.</div></div>})}</div>}</div>
}

function Afford({purchase,setPurchase,result,setResult,currency}:any){
 return <div className="space-y-6"><div><h1 className="text-3xl font-black">Can I afford it?</h1><p className="mt-1 text-slate-600">Check a purchase against your current financial plan.</p></div><div className="card p-6 max-w-2xl"><label className="label">Purchase price</label><input className="input text-2xl font-bold" type="number" min="0" value={purchase} onChange={e=>{setPurchase(e.target.value)}} placeholder="e.g. 1500000"/><button className="btn-primary mt-4" onClick={setResult}>Check purchase <ChevronRight size={18}/></button>{result&&<div className="mt-5 rounded-2xl bg-slate-50 p-5"><div className="text-lg font-black">{result.status}</div><p className="mt-2 text-sm text-slate-600">{result.detail}</p></div>}</div></div>
}

function Debt({expenses,updateExpense,income,a,currency}:any){
 const i=expenses.findIndex((e:Expense)=>e.name==="Debt Repayment"); const debt=i>=0?expenses[i].amount:0; const rate=income?debt/income:0;
 return <div className="space-y-6"><div><h1 className="text-3xl font-black">Debt planner</h1><p className="mt-1 text-slate-600">Keep debt repayments within a sustainable part of your income.</p></div><div className="grid gap-4 md:grid-cols-3"><Stat title="Monthly debt payment" value={money(debt,currency)} icon={CreditCard}/><Stat title="Debt-to-income" value={`${Math.round(rate*100)}%`} icon={BarChart3}/><Stat title="Available after expenses" value={money(a.remaining,currency)} icon={CircleDollarSign}/></div><div className="card p-6 max-w-xl"><label className="label">Monthly debt repayment</label><input className="input" type="number" min="0" value={debt||""} onChange={e=>i>=0&&updateExpense(i,Number(e.target.value))}/><div className={`mt-5 rounded-xl p-4 ${rate>.3?"bg-red-50 text-red-800":"bg-blue-50 text-blue-800"}`}>{rate>.3?"Debt is above 30% of income. Prioritise repayment and avoid adding unnecessary debt.":"Your debt payment is within the 30% guideline used by this planner."}</div></div></div>
}