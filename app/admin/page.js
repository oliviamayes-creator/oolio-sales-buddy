import { getCurrentUser, isAdminOrOwner } from "../../lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "../../components/AppShell";
import AdminView from "../../components/AdminView";

export default async function AdminPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  if (!isAdminOrOwner(auth.profile)) redirect("/");
  return <AppShell profile={auth.profile}><AdminView profile={auth.profile} /></AppShell>;
}
