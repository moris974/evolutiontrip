-- =====================================================================
-- STORAGE — bucket "media" per le immagini reali (copertina, logo,
-- camere, luoghi, eventi, escursioni). Sostituisce le anteprime locali
-- (blob URL) usate finora nella UI con file davvero caricati e persistiti.
-- =====================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Lettura pubblica: necessaria perché le immagini vanno mostrate anche
-- nella PWA ospite (anon), senza autenticazione.
create policy "Lettura pubblica media"
  on storage.objects for select
  using (bucket_id = 'media');

-- Ogni host carica solo dentro la propria cartella (prima parte del path
-- = il proprio auth.uid()), per non poter scrivere/sovrascrivere file di
-- altri host all'interno dello stesso bucket condiviso.
create policy "Host carica nella propria cartella"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Host aggiorna i propri file"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Host elimina i propri file"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
