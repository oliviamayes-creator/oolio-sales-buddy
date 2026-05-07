import { getCurrentUser } from "../../lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "../../components/AppShell";
import DocumentsView from "../../components/DocumentsView";

export default async function DocsPage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  return <AppShell profile={auth.profile}><DocumentsView /></AppShell>;
}
