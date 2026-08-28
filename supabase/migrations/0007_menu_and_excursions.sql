-- =====================================================================
-- 1. MENU — colazione / mezza pensione / pensione completa
--    Ogni struttura sceglie, per ciascun tipo di pasto, se caricare
--    un PDF già pronto oppure costruirlo piatto per piatto.
-- =====================================================================
create type meal_type as enum ('colazione', 'mezza_pensione', 'pensione_completa');
create type menu_mode as enum ('pdf', 'builder');

create table public.property_menus (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  meal_type meal_type not null,
  mode menu_mode not null default 'pdf',
  pdf_url text,                          -- usato se mode = 'pdf'
  notes text,                            -- es. orari, allergeni, note generali
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (property_id, meal_type)
);

create trigger trg_property_menus_updated_at before update on public.property_menus
  for each row execute function public.set_updated_at();

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  property_menu_id uuid not null references public.property_menus(id) on delete cascade,
  course text not null,                  -- es. 'Antipasti', 'Primi', 'Secondi', 'Dolci'
  name text not null,
  description text,
  is_vegetarian boolean default false,
  is_vegan boolean default false,
  is_gluten_free boolean default false,
  sort_order int default 0
);

create index idx_menu_items_menu on public.menu_items(property_menu_id);

alter table public.property_menus enable row level security;
alter table public.menu_items enable row level security;

create policy "Host gestisce i menu delle proprie strutture"
  on public.property_menus for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "Lettura pubblica menu attivi"
  on public.property_menus for select using (is_active = true);

create policy "Host gestisce le voci dei propri menu"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.property_menus pm
      join public.properties p on p.id = pm.property_id
      where pm.id = property_menu_id and p.owner_id = auth.uid()
    ) or public.is_super_admin()
  )
  with check (
    exists (
      select 1 from public.property_menus pm
      join public.properties p on p.id = pm.property_id
      where pm.id = property_menu_id and p.owner_id = auth.uid()
    )
  );

create policy "Lettura pubblica voci menu"
  on public.menu_items for select using (true);

-- =====================================================================
-- 2. ESCURSIONI — simili ai "luoghi" ma con durata, difficoltà e
--    punto di ritrovo: informazioni che un consiglio semplice non ha.
-- =====================================================================
create type excursion_difficulty as enum ('facile', 'media', 'impegnativa');

create table public.excursions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  name text not null,
  description text,
  duration_hours numeric(4,1),
  difficulty excursion_difficulty default 'facile',
  meeting_point text,
  price numeric(10,2),
  currency text default 'EUR',
  is_bookable boolean not null default false,  -- se prenotabile come i services, o solo informativa
  photo_urls text[] default '{}',
  is_published boolean not null default true,
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_excursions_property on public.excursions(property_id);

create trigger trg_excursions_updated_at before update on public.excursions
  for each row execute function public.set_updated_at();

alter table public.excursions enable row level security;

create policy "Host gestisce le escursioni delle proprie strutture"
  on public.excursions for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );

create policy "Lettura pubblica escursioni pubblicate"
  on public.excursions for select using (is_published = true);
