-- Avviso in evidenza mostrato in Home nell'app ospite (es. "Manutenzione
-- piscina"), modificabile dall'host — prima era testo fisso nel codice.
alter table public.properties
  add column notice_title text,
  add column notice_message text,
  add column notice_active boolean not null default false;
