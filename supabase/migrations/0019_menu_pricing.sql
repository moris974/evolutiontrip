-- Permette all'host di indicare che un piano pasti (colazione, mezza
-- pensione, pensione completa) è a pagamento invece che incluso nel
-- soggiorno, con un prezzo opzionale da mostrare all'ospite.
alter table public.property_menus
  add column is_included boolean not null default true,
  add column price numeric;
