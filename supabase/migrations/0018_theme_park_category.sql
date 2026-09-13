-- Aggiunge "parco_tematico" alle categorie disponibili per i luoghi
-- (place_category), richiesta dall'host per segnalare parchi divertimento
-- e parchi tematici tra i consigli agli ospiti.
alter type place_category add value if not exists 'parco_tematico';
