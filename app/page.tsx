import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="grid h-10 w-10 place-items-center rounded-xl bg-[#0B5ED7] text-lg font-black text-white"
              aria-hidden
            >
              E
            </div>
            <span className="font-bold text-[#102033]">Easer Financial Planner</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-slate-600 hover:text-[#0B5ED7]">
              Sign in
            </Link>
            <Link href="/login" className="btn-primary">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-bold tracking-widest text-[#0B5ED7]">
            PERSONAL FINANCE MADE EASIER
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-[#102033] md:text-6xl">
            Make Every Naira Count.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Plan your income, understand your expenses, build savings goals and make better
            spending decisions with one simple financial planner.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/login" className="btn-primary px-6 py-3">
              Create your free plan
            </Link>
            <a href="#features" className="btn-secondary px-6 py-3">
              See features
            </a>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Planning guidance only — not regulated financial advice.
          </p>
        </div>
      </section>

      <section id="features" className="mx-auto grid max-w-6xl gap-4 px-4 pb-20 md:grid-cols-3">
        {[
          [
            "Budget planner",
            "See where your money should go and compare it with your real expenses.",
          ],
          [
            "Savings goals",
            "Turn big purchases and life goals into clear monthly targets.",
          ],
          [
            "Financial health",
            "Get a simple score and practical warnings when your budget is under pressure.",
          ],
        ].map(([t, d]) => (
          <div className="card p-6 text-left" key={t}>
            <div className="mb-3 h-1 w-12 rounded-full bg-[#D62828]" aria-hidden />
            <h2 className="text-xl font-bold text-[#102033]">{t}</h2>
            <p className="mt-2 text-slate-600">{d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-slate-100 bg-[#F5F8FC] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center text-sm text-slate-500 md:flex-row md:justify-between md:text-left">
          <p>© {new Date().getFullYear()} Easer Financial Planner. Planning tool, not financial advice.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/privacy" className="hover:text-[#0B5ED7]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#0B5ED7]">
              Terms
            </Link>
            <Link href="/disclaimer" className="hover:text-[#0B5ED7]">
              Disclaimer
            </Link>
            <Link href="/cookies" className="hover:text-[#0B5ED7]">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
