import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Admin from "@/components/Admin";

export default async function Page() {
  const u = await getCurrentUser();

  if (!u || u.plan !== "ADMIN") {
    redirect("/dashboard");
  }

  return <Admin />;
}