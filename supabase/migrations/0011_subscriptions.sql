-- =====================================================================
-- Abbonamento SaaS: ogni host (owner_id) ha un abbonamento, con periodo
-- di prova gratuito a scadenza prima dell'attivazione del pagamento.
-- =====================================================================
create type subscription_plan as enum ('trial', 'base', 'pro', 'multi_struttura');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan subscription_plan not null default 'trial',
  status subscription_status not null default 'trialing',
  trial_ends_at timestamptz,              -- scadenza del periodo di prova
  current_period_end timestamptz,         -- scadenza del ciclo di fatturazione corrente
  price_monthly numeric(10,2),
  currency text default 'EUR',
  payment_provider text,                  -- es. 'stripe'
  payment_customer_id text,               -- ID cliente sul provider di pagamento
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create trigger trg_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "Host vede e gestisce solo il proprio abbonamento"
  on public.subscriptions for select
  using (owner_id = auth.uid() or public.is_super_admin());

create policy "Solo backend crea/aggiorna abbonamenti"
  on public.subscriptions for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
  -- Le modifiche di stato/piano arrivano dai webhook del provider di
  -- pagamento (service role), non direttamente dall'host via client.

-- Al momento della registrazione, assegna automaticamente un periodo
-- di prova di 14 giorni.
create or replace function public.start_trial_for_new_host()
returns trigger as $$
begin
  if new.role = 'host' then
    insert into public.subscriptions (owner_id, plan, status, trial_ends_at)
    values (new.id, 'trial', 'trialing', now() + interval '14 days');
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_start_trial_for_new_host
  after insert on public.profiles
  for each row execute function public.start_trial_for_new_host();
