-- Il campanello reception riusa la tabella "messages" già esistente:
-- un messaggio con sender='guest' e booking_id null, riconoscibile dal
-- flag is_bell, per distinguerlo da un messaggio scritto in chat.
alter table public.messages add column is_bell boolean not null default false;

comment on column public.messages.is_bell is
  'true se il messaggio è stato generato dal tasto "Campanello reception" nell''app ospite (nessun testo scritto, richiesta di assistenza immediata).';
