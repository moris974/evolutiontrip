-- =====================================================================
-- 1. Motivo del soggiorno — utile per profilare l'ospite e fare
--    promozioni mirate (es. "torna un cliente fedele che viene per fiera X")
-- =====================================================================
create type stay_purpose as enum ('fiera_lavoro', 'famiglia', 'coppia', 'gruppo_amici', 'sport', 'altro');

alter table public.guest_stays
  add column stay_purpose stay_purpose,
  add column stay_purpose_note text;   -- es. nome della fiera specifica

comment on column public.guest_stays.stay_purpose is
  'Motivo del soggiorno dichiarato dall''ospite o inserito dall''host, per segmentazione e promozioni mirate.';

-- Vista di supporto: quante volte lo stesso ospite (per email) è tornato,
-- utile per individuare i clienti fedeli a cui proporre promozioni.
create view public.guest_loyalty as
select
  property_id,
  lower(guest_email) as guest_email,
  guest_name,
  count(*) as stays_count,
  array_agg(distinct stay_purpose) filter (where stay_purpose is not null) as purposes,
  max(check_out_date) as last_checkout
from public.guest_stays
where guest_email is not null
group by property_id, lower(guest_email), guest_name;

grant select on public.guest_loyalty to authenticated;

-- =====================================================================
-- 2. FIERE & EVENTI — sezione dedicata, distinta dai "luoghi" perché
--    ha un intervallo di date specifico invece di un indirizzo fisso
--    da consigliare sempre.
-- =====================================================================
create type event_category as enum ('fiera', 'evento_locale', 'sagra', 'concerto', 'sport', 'altro');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category event_category not null default 'evento_locale',
  name text not null,
  description text,
  venue text,                            -- es. "Fiera di Genova, Pad. B"
  latitude double precision,
  longitude double precision,
  start_date date not null,
  end_date date,
  official_url text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_events_property on public.events(property_id);
create index idx_events_dates on public.events(start_date, end_date);

create trigger trg_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();

alter table public.events enable row level security;

create policy "Host gestisce gli eventi delle proprie strutture"
  on public.events for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "Lettura pubblica eventi pubblicati"
  on public.events for select
  using (is_published = true);
