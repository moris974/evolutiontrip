-- =====================================================================
-- Aggiunge il "numero di prenotazione" come identificativo umano-leggibile
-- per l'accesso ospite, accanto al token usato per link/QR.
-- Un cliente può quindi accedere in due modi:
--   1) link/QR diretto -> access_token (UUID, non digitabile a mano)
--   2) form di accesso manuale -> cognome + booking_number
-- =====================================================================

alter table public.guest_stays
  add column booking_number text,
  add column guest_surname text;

-- Il numero di prenotazione è univoco per struttura (non globalmente,
-- perché ogni host/PMS genera i propri numeri in autonomia).
create unique index idx_guest_stays_booking_number
  on public.guest_stays(property_id, booking_number)
  where booking_number is not null;

comment on column public.guest_stays.booking_number is
  'Numero di prenotazione (dal PMS o inserito manualmente dall''host), usato per il login manuale dell''ospite insieme al cognome.';

-- ---------------------------------------------------------------------
-- Funzione RPC sicura per la verifica dell'accesso manuale.
-- Evita di esporre l'intera tabella guest_stays in lettura pubblica:
-- il client anon può solo chiamare questa funzione, che restituisce
-- l'access_token corrispondente se cognome + numero combaciano.
-- ---------------------------------------------------------------------
create or replace function public.verify_guest_login(
  p_property_slug text,
  p_booking_number text,
  p_surname text
)
returns uuid  -- restituisce l'access_token se la verifica ha successo
language plpgsql
security definer
as $$
declare
  v_token uuid;
begin
  select gs.access_token into v_token
  from public.guest_stays gs
  join public.properties p on p.id = gs.property_id
  where p.slug = p_property_slug
    and gs.booking_number = p_booking_number
    and lower(gs.guest_surname) = lower(p_surname);

  return v_token; -- null se non trovato: nessuna informazione aggiuntiva esposta
end;
$$;

revoke all on function public.verify_guest_login(text, text, text) from public;
grant execute on function public.verify_guest_login(text, text, text) to anon, authenticated;
