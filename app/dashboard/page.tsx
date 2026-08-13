import { redirect } from "next/navigation";
import Dashboard from "@/components/Dashboard";
import { getCurrentUser } from "@/lib/auth";
export default async function Page(){const user=await getCurrentUser();if(!user)redirect("/login");return <Dashboard initialUser={{id:user.id,name:user.name,email:user.email,currency:user.currency,plan:user.plan}}/>;}