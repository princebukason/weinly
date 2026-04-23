import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SupplierDashboardClient from "./SupplierDashboardClient";

export default async function SupplierDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/supplier/auth");

  const role = user.user_metadata?.role;
  if (role !== "supplier") redirect("/auth");

  const { data: profile, error: profileError } = await supabase
    .from("supplier_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/supplier/auth");
  }

  if (profile.status !== "approved") {
    redirect("/supplier/pending");
  }

  const { data: requests, error: requestsError } = await supabase
    .from("fabric_requests")
    .select("*")
    .in("status", ["submitted", "quoted"])
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: myQuotes, error: quotesError } = await supabase
    .from("quotes")
    .select("*")
    .eq("supplier_user_id", user.id)
    .order("id", { ascending: false });

  if (requestsError || quotesError) {
    return (
      <div className="p-6 text-white">
        Failed to load supplier dashboard.
      </div>
    );
  }

  const myQuotedRequestIds = new Set((myQuotes || []).map((q) => q.request_id));

  const availableRequests = (requests || []).filter(
    (request) => !myQuotedRequestIds.has(request.id)
  );

  return (
    <SupplierDashboardClient
      user={{
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.company_name || null,
      }}
      profile={profile}
      requests={availableRequests}
      myQuotes={myQuotes || []}
    />
  );
}