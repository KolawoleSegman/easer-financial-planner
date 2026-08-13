import Link from "next/link";

export const metadata = { title: "Financial Disclaimer" };

export default function DisclaimerPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-[#0B5ED7]">
        ← Home
      </Link>
      <h1 className="mt-4 text-3xl font-black text-[#102033]">Financial Disclaimer</h1>
      <div className="mt-8 space-y-4 text-slate-700">
        <p>
          Easer Financial Planner is a personal finance <strong>planning and education
          tool</strong>. It does <strong>not</strong> provide regulated investment advice,
          tax advice, legal advice, or guaranteed financial outcomes.
        </p>
        <p>
          Suggested budget percentages, emergency-fund targets, affordability labels, and
          health scores are <strong>illustrative guidelines</strong> based on the numbers you
          enter. They are not personalised recommendations from a licensed adviser and may not
          suit your circumstances.
        </p>
        <p>
          We do not guarantee savings, investment returns, debt elimination, or financial
          success. Always consider seeking advice from a qualified professional before making
          material financial decisions.
        </p>
        <p>
          If features expand into regulated financial services in any jurisdiction, obtain
          appropriate licences and legal advice before offering them.
        </p>
      </div>
    </main>
  );
}
