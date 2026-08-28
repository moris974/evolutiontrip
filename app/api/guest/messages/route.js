import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase/server";

// Le policy RLS di "messages" permettono lettura/scrittura complete solo
// all'host proprietario; l'inserimento lato ospite è pensato per passare
// da qui (service role), come indicato nel commento della migration.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");
  const guestStayId = searchParams.get("guestStayId");
  if (!propertyId || !guestStayId) {
    return NextResponse.json({ error: "propertyId e guestStayId sono obbligatori" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("property_id", propertyId)
    .eq("guest_stay_id", guestStayId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data || [] });
}

export async function POST(request) {
  const body = await request.json();
  const { propertyId, guestStayId, text, isBell } = body || {};
  if (!propertyId || !guestStayId || (!text && !isBell)) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      property_id: propertyId,
      guest_stay_id: guestStayId,
      sender: "guest",
      body: isBell ? "🔔 Richiesta di assistenza immediata" : String(text).slice(0, 2000),
      is_bell: !!isBell,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: data });
}
