-- =====================================================================
-- 1. Social media della struttura
-- =====================================================================
alter table public.properties
  add column instagram_url text,
  add column facebook_url text,
  add column tiktok_url text,
  add column website_url text;

-- =====================================================================
-- 2. Foto delle camere (galleria, distinta dalla cover_photo_url generale)
-- =====================================================================
create table public.property_rooms (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  description text,
  photo_urls text[] default '{}',
  sort_order int default 0,
  created_at timestamptz not null default now()
);

create index idx_property_rooms_property on public.property_rooms(property_id);

alter table public.property_rooms enable row level security;

create policy "Host gestisce le camere delle proprie strutture"
  on public.property_rooms for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "Lettura pubblica camere"
  on public.property_rooms for select using (true);

-- =====================================================================
-- 3. Link ufficiale per luoghi ed escursioni (events lo aveva già)
-- =====================================================================
alter table public.places add column official_url text;
alter table public.excursions add column official_url text;

-- =====================================================================
-- 4. Calendario prenotazione tavolo/pasto nella sezione Menù
-- =====================================================================
create table public.menu_reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_stay_id uuid references public.guest_stays(id) on delete set null,
  meal_type meal_type not null,
  reservation_date date not null,
  reservation_time time not null,
  party_size int not null default 2,
  notes text,
  status booking_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index idx_menu_reservations_property on public.menu_reservations(property_id, reservation_date);

alter table public.menu_reservations enable row level security;

create policy "Host gestisce le prenotazioni del proprio menù"
  on public.menu_reservations for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (true); -- l'insert lato ospite arriva da API server-side

-- =====================================================================
-- 5. Parcheggio coperto/esterno: non serve nuova tabella, sono due righe
--    in "services" con nome dedicato (già gestibile dallo schema Fase 1).
--    Le aggiungiamo qui come dato di esempio.
-- =====================================================================
comment on table public.services is
  'Include anche servizi come "Parcheggio coperto" e "Parcheggio esterno": nessuna colonna dedicata necessaria, si distinguono per nome/descrizione.';
