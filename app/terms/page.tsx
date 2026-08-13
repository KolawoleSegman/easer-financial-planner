import Link from "next/link";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-[#0B5ED7]">
        ← Home
      </Link>
      <h1 className="mt-4 text-3xl font-black text-[#102033]">Terms of Service (Draft)</h1>
      <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
        Draft template only. Obtain legal review before production use.
      </p>
      <div className="mt-8 space-y-4 text-slate-700">
        <p>
          Easer Financial Planner provides software tools for personal budgeting and planning.
          It is not a bank, credit provider, investment adviser, or broker.
        </p>
        <p>
          You are responsible for the accuracy of data you enter and for decisions you make.
          Outputs are illustrative planning guidance, not guarantees of financial outcomes.
        </p>
        <p>
          Premium features may require payment via Paystack. Pricing and refund rules must be
          stated clearly before purchase. Subscription cancellations and chargebacks follow
          provider and applicable consumer law processes.
        </p>
        <p>
          We may suspend accounts for abuse, fraud, or security reasons. You must not attempt
          to circumvent payment, access other users&apos; data, or attack the service.
        </p>
      </div>
    </main>
  );
}
