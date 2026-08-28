import { NextResponse } from "next/server";
import { createServiceClient } from "../../../../lib/supabase/server";

export async function POST(request) {
  const body = await request.json();
  const { propertyId, guestStayId, rating, comment } = body || {};
  if (!propertyId || !rating) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      property_id: propertyId,
      guest_stay_id: guestStayId || null,
      rating: Math.max(1, Math.min(5, parseInt(rating, 10))),
      comment: comment?.trim() || null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ feedback: data });
}
