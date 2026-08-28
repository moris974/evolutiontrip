-- Colori di tema per l'app ospite (oltre al brand_color già esistente,
-- usato per i pulsanti) e l'elenco delle sezioni che l'host può
-- mostrare/nascondere nella navigazione dell'app ospite.
alter table public.properties
  add column home_color text,
  add column accent_color text,
  add column visible_sections jsonb;
