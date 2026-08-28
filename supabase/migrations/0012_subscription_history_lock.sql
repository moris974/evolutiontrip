-- =====================================================================
-- 1. Storico pagamenti abbonamento — un record per ogni ciclo fatturato,
--    così si vede lo storico di pagati / in scadenza / scaduti.
-- =====================================================================
create type payment_status as enum ('paid', 'upcoming', 'past_due', 'failed', 'refunded');

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan subscription_plan not null,
  amount numeric(10,2) not null,
  currency text default 'EUR',
  status payment_status not null default 'upcoming',
  period_start date not null,
  period_end date not null,           -- scadenza di questo ciclo
  paid_at timestamptz,
  invoice_url text,
  created_at timestamptz not null default now()
);

create index idx_subscription_payments_owner on public.subscription_payments(owner_id, period_end);
create index idx_subscription_payments_status on public.subscription_payments(status);

alter table public.subscription_payments enable row level security;

create policy "Host vede lo storico pagamenti del proprio abbonamento"
  on public.subscription_payments for select
  using (owner_id = auth.uid() or public.is_super_admin());

create policy "Solo backend scrive lo storico pagamenti"
  on public.subscription_payments for insert
  with check (public.is_super_admin());
  -- I record arrivano dai webhook del provider di pagamento (service role).

-- Vista comoda: pagamenti raggruppati per stato temporale
create view public.subscription_payments_overview as
select
  sp.*,
  case
    when sp.status = 'paid' then 'pagato'
    when sp.period_end < current_date and sp.status != 'paid' then 'scaduto'
    when sp.period_end <= current_date + interval '7 days' and sp.status != 'paid' then 'in_scadenza'
    else 'programmato'
  end as timeline_bucket
from public.subscription_payments sp;

grant select on public.subscription_payments_overview to authenticated;

-- =====================================================================
-- 2. Blocco struttura per mancato rinnovo
-- =====================================================================
alter table public.properties
  add column is_locked boolean not null default false,
  add column locked_reason text,
  add column locked_at timestamptz;

comment on column public.properties.is_locked is
  'true = struttura bloccata (es. abbonamento scaduto e non rinnovato). L''app ospite mostra un avviso invece dei contenuti; la dashboard host resta accessibile in sola lettura per permettere il rinnovo.';

-- Funzione richiamabile da un job schedulato (cron) o da un webhook di
-- mancato pagamento: blocca automaticamente le strutture il cui
-- abbonamento è scaduto da più di N giorni di grazia senza rinnovo.
create or replace function public.auto_lock_expired_subscriptions(grace_days int default 3)
returns int
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  update public.properties p
  set is_locked = true, locked_reason = 'Abbonamento scaduto e non rinnovato', locked_at = now()
  from public.subscriptions s
  where s.owner_id = p.owner_id
    and s.status in ('past_due', 'expired')
    and s.current_period_end < now() - (grace_days || ' days')::interval
    and p.is_locked = false;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Sblocco manuale (es. l'host paga o il supporto interviene)
create or replace function public.unlock_property(p_property_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.properties
  set is_locked = false, locked_reason = null, locked_at = null
  where id = p_property_id;
end;
$$;
