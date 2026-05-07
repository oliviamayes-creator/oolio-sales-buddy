import { getCurrentUser } from "../lib/supabase-server";
import { redirect } from "next/navigation";
import AppShell from "../components/AppShell";
import ChatView from "../components/ChatView";

export default async function HomePage() {
  const auth = await getCurrentUser();
  if (!auth) redirect("/login");
  return (
    <AppShell profile={auth.profile}>
      <ChatView />
    </AppShell>
  );
}
