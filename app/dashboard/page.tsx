import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const role = user.user_metadata?.role;
  if (role === "supplier") redirect("/supplier/dashboard");

  const { data: requests } = await supabase
    .from("fabric_requests")
    .select("*")
    .eq("client_email", user.email!)
    .order("created_at", { ascending: false });

  const requestList = requests || [];
  const requestIds = requestList.map((r) => r.id);

  let quotesMap: Record<string, any[]> = {};

  if (requestIds.length > 0) {
    const { data: quotes } = await supabase
      .from("quotes")
      .select("*")
      .in("request_id", requestIds)
      .order("id", { ascending: false });

    (quotes || []).forEach((q) => {
      if (!quotesMap[q.request_id]) quotesMap[q.request_id] = [];
      quotesMap[q.request_id].push(q);
    });
  }

  return (
    <DashboardClient
      user={{
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.full_name || null,
        phone: user.user_metadata?.phone || null,
      }}
      requests={requestList}
      quotesMap={quotesMap}
    />
  );
}