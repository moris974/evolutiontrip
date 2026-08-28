-- Tipologia della camera (matrimoniale, doppia, singola, ecc.), scelta da
-- un set fisso di opzioni in dashboard. Colonna testuale semplice, così
-- l'elenco di tipologie resta modificabile lato applicazione senza dover
-- toccare un enum del database.
alter table public.property_rooms add column room_type text;
