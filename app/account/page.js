import { getCurrentUser } from "../../lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "../../components/AppShell";
import AccountView from "../../components/AccountView";

export default async function AccountPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  return <AppShell profile={auth.profile}><AccountView profile={auth.profile} /></AppShell>;
}
