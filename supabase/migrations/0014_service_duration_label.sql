-- La dashboard host gestisce la durata di un servizio come testo libero
-- (es. "2 ore", "Giornaliero", "A notte", "Su richiesta"), non come un
-- numero di minuti: aggiungiamo una colonna dedicata invece di forzare
-- una conversione con perdita di informazione su duration_minutes.
alter table public.services add column duration_label text;
