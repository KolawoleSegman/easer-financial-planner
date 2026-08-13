import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-[#0B5ED7]">
        ← Home
      </Link>
      <h1 className="mt-4 text-3xl font-black text-[#102033]">Privacy Policy (Draft)</h1>
      <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
        This is a draft template only. Have it reviewed by qualified legal counsel before
        production use, including under the Nigeria Data Protection Act (NDPA) and any other
        applicable laws.
      </p>
      <div className="prose prose-slate mt-8 space-y-4 text-slate-700">
        <p>
          Easer Financial Planner (&quot;we&quot;) processes personal data to provide budgeting
          and planning tools. Categories may include account details (name, email), financial
          inputs you provide (income, expenses, goals), and technical data (session cookies, IP
          for security).
        </p>
        <p>
          <strong>Lawful basis (to be confirmed by counsel):</strong> contract performance,
          legitimate interests (security, fraud prevention), and consent where required.
        </p>
        <p>
          <strong>Retention:</strong> account data is retained while your account is active.
          After deletion requests we aim to delete or anonymise personal data within a
          reasonable period, subject to legal retention needs (e.g. payment records).
        </p>
        <p>
          <strong>Your rights:</strong> depending on applicable law, you may have rights to
          access, correct, delete, or port your data. Use in-app account deletion or contact
          the address published on our site.
        </p>
        <p>
          <strong>Processors:</strong> we may use infrastructure and payment providers (e.g.
          hosting, Paystack, email delivery). Ensure processor agreements and transfer
          safeguards are in place before launch.
        </p>
        <p>
          <strong>Children:</strong> the service is not directed at children. Do not create
          accounts for minors without appropriate legal basis.
        </p>
        <p>Contact: set a privacy contact email before launch.</p>
      </div>
    </main>
  );
}
