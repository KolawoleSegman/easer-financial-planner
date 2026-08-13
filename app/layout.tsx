import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Easer Financial Planner — Plan Your Money Better",
    template: "%s | Easer Financial Planner",
  },
  description:
    "Plan your income, understand your expenses, build savings goals and make better spending decisions. A simple personal finance planner for Nigeria and beyond.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Easer Financial Planner",
    description: "Plan Your Money Better with Easer Financial Planner",
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "Easer Financial Planner",
    description: "Plan Your Money Better with Easer Financial Planner",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
