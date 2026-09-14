import { createServiceClient } from "../../../lib/supabase/server";
import GuestWelcomeBook from "../../../components/GuestWelcomeBook";

// Carichiamo TUTTE le colonne di "properties" con select("*") invece di
// elencarle a mano una per una. Prima, ogni volta che si aggiungeva una
// colonna nuova (es. notice_title) bisognava ricordarsi di aggiungerla
// anche qui: se la migration su Supabase non era ancora stata eseguita,
// la select falliva per intero e la pagina mostrava "Link non valido"
// anche per un link corretto. Con select("*") questo non può più
// succedere: qualunque colonna esista davvero nel database viene letta,
// punto — nessuna lista da tenere sincronizzata a mano.

// Carica tutti i contenuti pubblici di una struttura (luoghi, servizi,
// eventi, escursioni, menù, camere) in un colpo solo, lato server.
// Queste tabelle hanno già policy RLS di lettura pubblica (pensate per
// l'app ospite), quindi userebbero anche il client anonimo — usiamo
// comunque il service role per uniformità con il resto di questa route,
// che DEVE usarlo per "properties" (priva di lettura pubblica).
async function loadGuestContent(supabase, propertyId) {
  const [{ data: rooms }, { data: places }, { data: services }, { data: events }, { data: excursions }, { data: menus }] = await Promise.all([
    supabase.from("property_rooms").select("*").eq("property_id", propertyId).order("sort_order", { ascending: true }),
    supabase.from("places").select("*").eq("property_id", propertyId).eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("services").select("*").eq("property_id", propertyId).eq("is_active", true).order("sort_order", { ascending: true }),
    supabase.from("events").select("*").eq("property_id", propertyId).eq("is_published", true).order("start_date", { ascending: true }),
    supabase.from("excursions").select("*").eq("property_id", propertyId).eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("property_menus").select("*, menu_items(*)").eq("property_id", propertyId).eq("is_active", true),
  ]);
  return {
    rooms: rooms || [],
    places: places || [],
    services: services || [],
    events: events || [],
    excursions: excursions || [],
    menus: menus || [],
  };
}

// Il parametro nell'URL copre due casi diversi, entrambi validi:
//  1) il link generico della struttura, condiviso dall'host da "Dati
//     struttura" -> è lo slug pubblico della property (es. /g/villa-mare)
//  2) il link personalizzato di un singolo ospite, copiato dalla sezione
//     "Ospiti" -> è un guest_stays.access_token (UUID)
// Proviamo prima come token di un soggiorno; se non corrisponde a nulla,
// ricadiamo sullo slug della struttura.
//
// Nota di sicurezza: "properties" non ha una policy RLS di lettura
// pubblica (per non esporre wifi_password ecc. a chi interroga l'API
// Supabase direttamente). Qui siamo in un Server Component eseguito solo
// lato server: usiamo il client con service role per leggere i dati e li
// passiamo già pronti al componente client, senza mai esporre credenziali
// privilegiate al browser.
export default async function GuestPage({ params }) {
  const supabase = createServiceClient();
  const token = params.token;
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

  if (looksLikeUuid) {
    const { data: stay, error: stayError } = await supabase
      .from("guest_stays")
      .select("id, guest_name, check_in_date, check_out_date, properties (*)")
      .eq("access_token", token)
      .maybeSingle();

    if (stayError) console.error("Errore caricamento soggiorno ospite:", stayError.message);

    if (stay?.properties) {
      const content = await loadGuestContent(supabase, stay.properties.id);
      return <GuestWelcomeBook accessToken={token} property={stay.properties} guestStay={stay} {...content} />;
    }
  }

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("slug", token)
    .maybeSingle();

  if (propertyError) console.error("Errore caricamento struttura:", propertyError.message);

  if (!property) {
    return <GuestWelcomeBook notFound />;
  }

  const content = await loadGuestContent(supabase, property.id);
  return <GuestWelcomeBook accessToken={token} property={property} {...content} />;
}
