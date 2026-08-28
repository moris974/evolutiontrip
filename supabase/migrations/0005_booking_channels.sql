-- =====================================================================
-- Provenienza delle prenotazioni: Booking.com, Airbnb, sito diretto, ecc.
-- =====================================================================

create type booking_channel as enum ('direct', 'website', 'booking_com', 'airbnb', 'other_ota', 'phone_email');

alter table public.guest_stays
  add column channel booking_channel not null default 'direct',
  add column external_reservation_id text;  -- ID della prenotazione lato Booking/Airbnb/PMS

create index idx_guest_stays_channel on public.guest_stays(property_id, channel);
create unique index idx_guest_stays_external_id
  on public.guest_stays(property_id, channel, external_reservation_id)
  where external_reservation_id is not null;

comment on column public.guest_stays.channel is
  'Da dove arriva la prenotazione: sito diretto, Booking.com, Airbnb, altra OTA (via channel manager) o telefono/email.';
comment on column public.guest_stays.external_reservation_id is
  'ID della prenotazione nel sistema di origine, per evitare duplicati quando arriva più volte via webhook.';

-- ---------------------------------------------------------------------
-- Il webhook in app/api/webhooks/pms/route.ts riceve un payload
-- standardizzato dal Channel Manager (che fa da ponte con Booking.com
-- e Airbnb) o dal motore di prenotazione del sito, e fa upsert qui:
--
--   insert into guest_stays (property_id, guest_name, guest_email,
--     booking_number, channel, external_reservation_id,
--     check_in_date, check_out_date)
--   values (...)
--   on conflict (property_id, channel, external_reservation_id)
--   do update set check_in_date = excluded.check_in_date, ...
--
-- Nota realistica: Booking.com e Airbnb non offrono API dirette a
-- integrazioni terze indipendenti — serve un Channel Manager
-- certificato come ponte. Il sito web diretto invece si collega
-- senza intermediari, con un webhook proprio.
-- ---------------------------------------------------------------------
