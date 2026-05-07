import { getCurrentUser } from "../../lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "../../components/AppShell";
import AdminView from "../../components/AdminView";

export default async function AdminPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (auth.profile?.role !== "admin") redirect("/");
  return <AppShell profile={auth.profile}><AdminView /></AppShell>;
}
