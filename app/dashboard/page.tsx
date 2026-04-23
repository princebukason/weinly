import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
};

type FabricRequest = {
  id: string;
  created_at: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  user_input: string;
  ai_output: unknown;
  status: string | null;
  contact_request_status: string | null;
  contact_access_fee: string | null;
  payment_status: string | null;
  payment_reference: string | null;
  paid_at: string | null;
};

type Quote = {
  id: string;
  request_id: string;
  supplier_name: string;
  price: string | null;
  moq: string | null;
  note: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_wechat: string | null;
  contact_email: string | null;
  supplier_region: string | null;
  lead_time: string | null;
  is_contact_released: boolean | null;
};

type Subscription = {
  plan?: string | null;
  expires_at?: string | null;
} | null;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth?next=/dashboard");

  const profile: UserProfile = {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    phone: user.user_metadata?.phone || null,
  };

  const { data: requestsData, error: requestsError } = await supabase
    .from("fabric_requests")
    .select(
      `
      id,
      created_at,
      client_name,
      client_email,
      client_phone,
      user_input,
      ai_output,
      status,
      contact_request_status,
      contact_access_fee,
      payment_status,
      payment_reference,
      paid_at
    `
    )
    .eq("client_email", user.email || "")
    .order("created_at", { ascending: false });

  if (requestsError) {
    return (
      <main className="min-h-screen bg-[#0a0f1e] p-6 text-white">
        Failed to load dashboard.
      </main>
    );
  }

  const requests = (requestsData || []) as FabricRequest[];
  const requestIds = requests.map((r) => r.id);

  let quotes: Quote[] = [];

  if (requestIds.length > 0) {
    const { data: quotesData, error: quotesError } = await supabase
      .from("quotes")
      .select(
        `
        id,
        request_id,
        supplier_name,
        price,
        moq,
        note,
        contact_name,
        contact_phone,
        contact_wechat,
        contact_email,
        supplier_region,
        lead_time,
        is_contact_released
      `
      )
      .in("request_id", requestIds)
      .order("id", { ascending: false });

    if (quotesError) {
      return (
        <main className="min-h-screen bg-[#0a0f1e] p-6 text-white">
          Failed to load supplier quotes.
        </main>
      );
    }

    quotes = (quotesData || []) as Quote[];
  }

  const quotesMap: Record<string, Quote[]> = {};
  for (const request of requests) {
    quotesMap[request.id] = [];
  }

  for (const quote of quotes) {
    if (!quotesMap[quote.request_id]) {
      quotesMap[quote.request_id] = [];
    }
    quotesMap[quote.request_id].push(quote);
  }

  let isPro = false;
  let subscription: Subscription = null;

  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("plan, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionData) {
    subscription = subscriptionData;
    if (
      subscriptionData.expires_at &&
      new Date(subscriptionData.expires_at).getTime() > Date.now()
    ) {
      isPro = true;
    }
  }

  return (
    <DashboardClient
      user={profile}
      requests={requests}
      quotesMap={quotesMap}
      isPro={isPro}
      subscription={subscription}
    />
  );
}