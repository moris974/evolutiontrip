import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase/server";

// bookings.insert ha "with check (true)" nella policy RLS proprio perché
// pensato per arrivare da un'API server-side come questa (service role),
// non direttamente dal client anonimo.
export async function POST(request) {
  const body = await request.json();
  const { propertyId, serviceId, guestStayId, guestName, guestContact, when, notes } = body || {};
  if (!propertyId || !serviceId || !guestName?.trim() || !guestContact?.trim()) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      property_id: propertyId,
      service_id: serviceId,
      guest_stay_id: guestStayId || null,
      guest_name: guestName.trim(),
      guest_contact: guestContact.trim(),
      notes: [when ? `Data/ora preferite: ${when}` : null, notes || null].filter(Boolean).join(" — ") || null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ booking: data });
}
