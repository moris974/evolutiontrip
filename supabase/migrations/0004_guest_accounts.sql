-- =====================================================================
-- Ospiti privati con account email+password (oltre a numero prenotazione)
-- Usa Supabase Auth per l'account, ma con ruolo 'guest' dedicato,
-- distinto dagli host — così un ospite privato può accedere a più
-- soggiorni nel tempo con lo stesso account, senza numero di prenotazione.
-- =====================================================================

-- Collega opzionalmente un soggiorno a un account Supabase Auth reale
-- (per gli ospiti che si registrano con email+password), mantenendo
-- comunque access_token e booking_number per gli altri due percorsi.
alter table public.guest_stays
  add column guest_user_id uuid references auth.users(id) on delete set null;

create index idx_guest_stays_guest_user on public.guest_stays(guest_user_id);

comment on column public.guest_stays.guest_user_id is
  'Valorizzato solo per ospiti privati che si sono registrati con email+password; null per accessi via token o numero di prenotazione.';

-- Il trigger handle_new_user esistente assegna ruolo 'host' di default:
-- estendiamolo per riconoscere il ruolo passato nei metadata in fase di
-- registrazione (così un ospite privato che si registra ottiene ruolo 'guest').
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'host'),
    new.raw_user_meta_data->>'full_name'
  );
  return new;
end;
$$ language plpgsql security definer;

-- RLS: un ospite privato autenticato vede solo i propri soggiorni
create policy "Ospiti privati vedono i propri soggiorni"
  on public.guest_stays for select
  using (guest_user_id = auth.uid());
