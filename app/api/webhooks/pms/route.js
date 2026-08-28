import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase/server";

// Endpoint che riceve le prenotazioni da: sito diretto (webhook proprio),
// o da un channel manager che aggrega Booking.com/Airbnb/altre OTA.
// Vedi supabase/migrations/0005_booking_channels.sql per lo schema.
export async function POST(request) {
  const body = await request.json();

  const {
    property_slug,
    guest_name,
    guest_email,
    booking_number,
    channel = "direct",
    external_reservation_id,
    check_in_date,
    check_out_date,
  } = body;

  if (!property_slug || !guest_name) {
    return NextResponse.json({ error: "property_slug e guest_name sono obbligatori" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("slug", property_slug)
    .single();

  if (propertyError || !property) {
    return NextResponse.json({ error: "Struttura non trovata" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("guest_stays")
    .upsert(
      {
        property_id: property.id,
        guest_name,
        guest_email,
        booking_number,
        channel,
        external_reservation_id,
        check_in_date,
        check_out_date,
      },
      { onConflict: "property_id,channel,external_reservation_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Qui in futuro: trigger invio email di benvenuto (Resend) con il link
  // /g/[access_token] generato per questo soggiorno.

  return NextResponse.json({ success: true, guest_stay: data });
}
