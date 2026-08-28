-- =====================================================================
-- DIGITAL WELCOME BOOK SAAS — Schema iniziale (Fase 1)
-- Database: Supabase / PostgreSQL
-- Multi-tenancy: Row Level Security (RLS) basata su auth.uid()
-- =====================================================================

-- ---------------------------------------------------------------------
-- ESTENSIONI
-- ---------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUM TYPES
-- ---------------------------------------------------------------------
create type user_role as enum ('super_admin', 'host', 'guest');
create type place_category as enum (
  'ristorante', 'bar', 'spiaggia', 'attrazione',
  'shopping', 'prodotto_locale', 'servizio', 'altro'
);
create type booking_status as enum ('pending', 'confirmed', 'declined', 'cancelled', 'completed');
create type email_trigger_type as enum ('pre_checkin', 'during_stay', 'post_checkout', 'custom');
create type notification_channel as enum ('email', 'whatsapp', 'in_app');

-- ---------------------------------------------------------------------
-- 1. PROFILES
-- Estende auth.users con dati applicativi e ruolo
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'host',
  full_name text,
  company_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Profilo utente collegato a auth.users; determina il ruolo (super_admin/host).';

-- ---------------------------------------------------------------------
-- 2. PROPERTIES (Strutture ricettive)
-- Un host può gestire più strutture (multi-property)
-- ---------------------------------------------------------------------
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,                    -- usato per URL pubblici/QR
  description text,
  address text,
  latitude double precision,
  longitude double precision,
  check_in_time time,
  check_out_time time,
  contact_email text,
  contact_phone text,
  wifi_ssid text,
  wifi_password text,
  house_rules text,
  emergency_numbers jsonb default '[]'::jsonb,   -- [{label, number}]
  cover_photo_url text,
  logo_url text,
  brand_color text default '#0f172a',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_properties_owner on public.properties(owner_id);
create index idx_properties_slug on public.properties(slug);

-- ---------------------------------------------------------------------
-- 3. CATEGORIES
-- Categorie dei "Consigli & Luoghi" (personalizzabili per struttura,
-- ma con un set di default condiviso)
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade, -- null = categoria globale/default
  name text not null,
  icon text,                                     -- nome icona Lucide
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create index idx_categories_property on public.categories(property_id);

-- ---------------------------------------------------------------------
-- 4. PLACES (Consigli & Luoghi — Digital Guidebook)
-- ---------------------------------------------------------------------
create table public.places (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  category place_category not null default 'altro', -- fallback rapido se non si usa categories custom
  name text not null,
  description text,
  host_tip text,                                 -- consiglio personalizzato dell'host
  discount_info text,                             -- sconto/convenzione dedicata agli ospiti
  address text,
  latitude double precision,
  longitude double precision,
  photo_urls text[] default '{}',
  season_start date,                              -- calendarizzazione stagionale
  season_end date,
  is_published boolean not null default true,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_places_property on public.places(property_id);
create index idx_places_category on public.places(category_id);
create index idx_places_published on public.places(is_published);

-- ---------------------------------------------------------------------
-- 5. SERVICES (Servizi extra / upselling)
-- ---------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2),
  currency text default 'EUR',
  duration_minutes int,
  photo_url text,
  is_bookable boolean not null default true,
  is_active boolean not null default true,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_property on public.services(property_id);

-- ---------------------------------------------------------------------
-- 6. GUEST STAYS (soggiorni / accesso token-based per ospiti)
-- Collega un token pubblico a una struttura + eventuale prenotazione PMS
-- ---------------------------------------------------------------------
create table public.guest_stays (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  access_token uuid not null default gen_random_uuid() unique, -- usato nell'URL /g/[token]
  guest_name text,
  guest_email text,
  guest_phone text,
  check_in_date date,
  check_out_date date,
  pms_reservation_id text,                        -- riferimento esterno al gestionale
  created_at timestamptz not null default now()
);

create index idx_guest_stays_token on public.guest_stays(access_token);
create index idx_guest_stays_property on public.guest_stays(property_id);

-- ---------------------------------------------------------------------
-- 7. BOOKINGS (Richieste di prenotazione servizi extra da parte ospiti)
-- ---------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  guest_stay_id uuid references public.guest_stays(id) on delete set null,
  guest_name text not null,
  guest_contact text,                              -- email o telefono
  requested_datetime timestamptz,
  notes text,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_bookings_property on public.bookings(property_id);
create index idx_bookings_status on public.bookings(status);

-- ---------------------------------------------------------------------
-- 8. EMAIL TEMPLATES (automazioni comunicazioni)
-- ---------------------------------------------------------------------
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  trigger_type email_trigger_type not null,
  subject text not null,
  body_html text not null,
  is_active boolean not null default true,
  send_offset_hours int default 0,                 -- es. -24 per "24h prima del check-in"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_email_templates_property on public.email_templates(property_id);

-- ---------------------------------------------------------------------
-- 9. NOTIFICATIONS (log invii + avvisi in tempo reale agli ospiti)
-- ---------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_stay_id uuid references public.guest_stays(id) on delete cascade,
  channel notification_channel not null,
  subject text,
  message text not null,
  sent_at timestamptz,
  status text default 'queued',                     -- queued | sent | failed
  created_at timestamptz not null default now()
);

create index idx_notifications_property on public.notifications(property_id);
create index idx_notifications_guest_stay on public.notifications(guest_stay_id);

-- ---------------------------------------------------------------------
-- TRIGGER: updated_at automatico
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger trg_properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger trg_places_updated_at before update on public.places
  for each row execute function public.set_updated_at();
create trigger trg_services_updated_at before update on public.services
  for each row execute function public.set_updated_at();
create trigger trg_bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();
create trigger trg_email_templates_updated_at before update on public.email_templates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- TRIGGER: crea automaticamente il profilo alla registrazione utente
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (new.id, 'host', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) — Multi-tenancy
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.categories enable row level security;
alter table public.places enable row level security;
alter table public.services enable row level security;
alter table public.guest_stays enable row level security;
alter table public.bookings enable row level security;
alter table public.email_templates enable row level security;
alter table public.notifications enable row level security;

-- Funzione helper: l'utente corrente è super_admin?
create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$ language sql stable security definer;

-- --- PROFILES ---
create policy "Utenti vedono e modificano solo il proprio profilo"
  on public.profiles for select
  using (id = auth.uid() or public.is_super_admin());

create policy "Utenti aggiornano solo il proprio profilo"
  on public.profiles for update
  using (id = auth.uid());

-- --- PROPERTIES ---
create policy "Host vede solo le proprie strutture"
  on public.properties for select
  using (owner_id = auth.uid() or public.is_super_admin());

create policy "Host crea strutture per sé stesso"
  on public.properties for insert
  with check (owner_id = auth.uid());

create policy "Host modifica solo le proprie strutture"
  on public.properties for update
  using (owner_id = auth.uid() or public.is_super_admin());

create policy "Host elimina solo le proprie strutture"
  on public.properties for delete
  using (owner_id = auth.uid() or public.is_super_admin());

-- Lettura pubblica (anon) delle properties: necessaria per la PWA ospite,
-- ma limitata a colonne non sensibili tramite una VIEW dedicata (vedi sotto).
-- Nessuna policy anon diretta su properties per proteggere wifi_password ecc.

-- --- CATEGORIES / PLACES / SERVICES / EMAIL TEMPLATES ---
-- Pattern comune: accesso host tramite ownership della property collegata;
-- accesso pubblico in sola lettura per i record "pubblicabili".

create policy "Host gestisce categorie delle proprie strutture"
  on public.categories for all
  using (
    property_id is null
    or exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    property_id is null
    or exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "Lettura pubblica categorie"
  on public.categories for select
  using (true);

create policy "Host gestisce i luoghi delle proprie strutture"
  on public.places for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "Lettura pubblica luoghi pubblicati"
  on public.places for select
  using (is_published = true);

create policy "Host gestisce i servizi delle proprie strutture"
  on public.services for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "Lettura pubblica servizi attivi"
  on public.services for select
  using (is_active = true);

-- --- GUEST STAYS ---
-- Accesso host (gestione); accesso ospite solo tramite token applicativo
-- (la verifica del token avviene lato API/server, non via RLS anon diretta,
-- per evitare di esporre l'intera tabella in lettura pubblica).
create policy "Host gestisce i soggiorni delle proprie strutture"
  on public.guest_stays for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

-- --- BOOKINGS ---
create policy "Host vede e gestisce le prenotazioni delle proprie strutture"
  on public.bookings for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (true); -- l'insert arriva da API server-side (service role) per gli ospiti

-- --- EMAIL TEMPLATES ---
create policy "Host gestisce i propri template email"
  on public.email_templates for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

-- --- NOTIFICATIONS ---
create policy "Host vede le notifiche delle proprie strutture"
  on public.notifications for select
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  );

create policy "Solo backend inserisce notifiche"
  on public.notifications for insert
  with check (true); -- gestito via service role key nelle API routes

-- =====================================================================
-- VIEW PUBBLICA: dati struttura sicuri per la PWA ospite (anon)
-- Esclude campi sensibili come wifi_password se necessario nasconderli
-- dietro autenticazione token; qui la mostriamo comunque per semplicità
-- del welcome book (Wi-Fi è pensato per essere visibile all'ospite).
-- =====================================================================
create view public.property_public_view as
select
  id, name, slug, description, address, latitude, longitude,
  check_in_time, check_out_time, contact_email, contact_phone,
  wifi_ssid, wifi_password, house_rules, emergency_numbers,
  cover_photo_url, logo_url, brand_color
from public.properties
where is_active = true;

grant select on public.property_public_view to anon, authenticated;
