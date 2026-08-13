import Link from "next/link";

export const metadata = { title: "Cookie Policy" };

export default function CookiesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-sm font-semibold text-[#0B5ED7]">
        ← Home
      </Link>
      <h1 className="mt-4 text-3xl font-black text-[#102033]">Cookie Policy (Draft)</h1>
      <p className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
        Draft template — legal review recommended.
      </p>
      <div className="mt-8 space-y-4 text-slate-700">
        <p>
          We use an essential session cookie (<code>easer_session</code>) to keep you signed
          in. It is HttpOnly, Secure in production, and SameSite=Lax. It is required for the
          service to function and is not used for third-party advertising.
        </p>
        <p>
          If you add analytics or marketing cookies later, update this notice and implement
          appropriate consent mechanisms where required by law.
        </p>
      </div>
    </main>
  );
}
