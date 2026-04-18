import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SupplierDashboardClient from "./SupplierDashboardClient";

export default async function SupplierDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/supplier/auth");

  const role = user.user_metadata?.role;
  if (role !== "supplier") redirect("/auth");

  // Get supplier profile
  const { data: profile } = await supabase
    .from("supplier_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get all open fabric requests
  const { data: requests } = await supabase
    .from("fabric_requests")
    .select("*")
    .eq("status", "submitted")
    .order("created_at", { ascending: false });

  // Get this supplier's quotes
  const { data: myQuotes } = await supabase
    .from("quotes")
    .select("*")
    .eq("supplier_user_id", user.id)
    .order("id", { ascending: false });

  return (
    <SupplierDashboardClient
      user={{ id: user.id, email: user.email!, name: user.user_metadata?.company_name || null }}
      profile={profile}
      requests={requests || []}
      myQuotes={myQuotes || []}
    />
  );
}