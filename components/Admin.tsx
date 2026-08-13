"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  createdAt: string;
  emailVerifiedAt: string | null;
};

export default function Admin() {
  const [users, setUsers] = useState<Row[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        if (d.users) setUsers(d.users);
        else setError(d.error || "Forbidden");
      })
      .catch(() => setError("Failed to load"));
  }, []);

  return (
    <main className="min-h-screen bg-[#F5F8FC] px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-black text-[#102033]">Admin</h1>
          <Link href="/dashboard" className="btn-secondary">
            Back to dashboard
          </Link>
        </div>
        {error && <div className="alert-warn mb-4">{error}</div>}
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Name</th>
                <th className="p-3">Plan</th>
                <th className="p-3">Verified</th>
                <th className="p-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3">{u.name || "—"}</td>
                  <td className="p-3">
                    <span
                      className={
                        u.plan === "PREMIUM" || u.plan === "ADMIN"
                          ? "badge-premium"
                          : "badge-free"
                      }
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="p-3">{u.emailVerifiedAt ? "Yes" : "No"}</td>
                  <td className="p-3">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Promote admins only via direct database update. Never expose role changes to the client.
        </p>
      </div>
    </main>
  );
}
