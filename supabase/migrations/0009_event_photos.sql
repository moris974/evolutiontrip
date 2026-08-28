-- Foto allegabili a fiere ed eventi (escursioni le avevano già)
alter table public.events add column photo_urls text[] default '{}';
