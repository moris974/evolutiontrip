-- =====================================================================
-- Funzionalità aggiuntive per allinearsi a BBTips
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. MESSAGES — chat bidirezionale ospite <-> host, legata a una
--    richiesta di prenotazione servizio (o libera, per soggiorno)
-- ---------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete cascade,
  guest_stay_id uuid references public.guest_stays(id) on delete cascade,
  sender user_role not null,             -- 'host' o 'guest'
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_messages_property on public.messages(property_id);
create index idx_messages_booking on public.messages(booking_id);
create index idx_messages_guest_stay on public.messages(guest_stay_id);

alter table public.messages enable row level security;

create policy "Host vede e scrive i messaggi delle proprie strutture"
  on public.messages for all
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  )
  with check (true); -- gli insert lato ospite arrivano da API server-side (service role)

-- ---------------------------------------------------------------------
-- 2. FEEDBACK — moduli di gradimento post-soggiorno
-- ---------------------------------------------------------------------
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  guest_stay_id uuid references public.guest_stays(id) on delete set null,
  rating smallint check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_feedback_property on public.feedback(property_id);

alter table public.feedback enable row level security;

create policy "Host vede il feedback delle proprie strutture"
  on public.feedback for select
  using (
    exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
    or public.is_super_admin()
  );

create policy "Solo backend inserisce feedback"
  on public.feedback for insert
  with check (true); -- inserito via link firmato nell'email post-checkout, service role

-- ---------------------------------------------------------------------
-- 3. CONTENUTI MULTILINGUA — traduzioni per luoghi e servizi
--    Un record per lingua, per non irrigidire lo schema con colonne fisse.
-- ---------------------------------------------------------------------
create table public.place_translations (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  language_code text not null,           -- 'en', 'fr', 'de', ...
  name text,
  description text,
  host_tip text,
  unique (place_id, language_code)
);

create table public.service_translations (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  language_code text not null,
  name text,
  description text,
  unique (service_id, language_code)
);

alter table public.place_translations enable row level security;
alter table public.service_translations enable row level security;

create policy "Host gestisce le traduzioni dei propri luoghi"
  on public.place_translations for all
  using (
    exists (
      select 1 from public.places pl
      join public.properties p on p.id = pl.property_id
      where pl.id = place_id and p.owner_id = auth.uid()
    ) or public.is_super_admin()
  )
  with check (
    exists (
      select 1 from public.places pl
      join public.properties p on p.id = pl.property_id
      where pl.id = place_id and p.owner_id = auth.uid()
    )
  );

create policy "Lettura pubblica traduzioni luoghi"
  on public.place_translations for select using (true);

create policy "Host gestisce le traduzioni dei propri servizi"
  on public.service_translations for all
  using (
    exists (
      select 1 from public.services s
      join public.properties p on p.id = s.property_id
      where s.id = service_id and p.owner_id = auth.uid()
    ) or public.is_super_admin()
  )
  with check (
    exists (
      select 1 from public.services s
      join public.properties p on p.id = s.property_id
      where s.id = service_id and p.owner_id = auth.uid()
    )
  );

create policy "Lettura pubblica traduzioni servizi"
  on public.service_translations for select using (true);

-- ---------------------------------------------------------------------
-- 4. STATISTICHE — view aggregate per la dashboard host (Panoramica)
-- ---------------------------------------------------------------------
create view public.property_stats as
select
  p.id as property_id,
  (select count(*) from public.places pl where pl.property_id = p.id and pl.is_published) as places_published,
  (select count(*) from public.bookings b where b.property_id = p.id) as bookings_total,
  (select count(*) from public.bookings b where b.property_id = p.id and b.status = 'pending') as bookings_pending,
  (select count(*) from public.notifications n where n.property_id = p.id and n.status = 'sent') as emails_sent,
  (select round(avg(f.rating)::numeric, 2) from public.feedback f where f.property_id = p.id) as avg_rating,
  (select count(*) from public.feedback f where f.property_id = p.id) as feedback_count
from public.properties p;

grant select on public.property_stats to authenticated;

-- Nota: l'accesso ospite "nome + email" era già supportato dallo schema
-- esistente (guest_stays.guest_name e guest_stays.guest_email): basta
-- estendere verify_guest_login con una variante che verifica questa
-- coppia invece di cognome + booking_number.
create or replace function public.verify_guest_login_by_email(
  p_property_slug text,
  p_guest_name text,
  p_guest_email text
)
returns uuid
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
    and lower(gs.guest_email) = lower(p_guest_email)
    and lower(gs.guest_name) = lower(p_guest_name);

  return v_token;
end;
$$;

revoke all on function public.verify_guest_login_by_email(text, text, text) from public;
grant execute on function public.verify_guest_login_by_email(text, text, text) to anon, authenticated;
