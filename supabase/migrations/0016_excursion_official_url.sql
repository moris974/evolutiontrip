-- Le schede di "luoghi" ed "eventi" hanno già un link ufficiale opzionale;
-- aggiungiamo lo stesso campo anche alle escursioni, che la dashboard host
-- già mostra in UI ma che nello schema originale mancava.
alter table public.excursions add column official_url text;
