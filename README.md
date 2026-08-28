# EvolutionTrip — Digital Welcome Book & Reception Digitale

SaaS web/PWA per B&B, hotel e case vacanza: guida digitale per gli ospiti,
dashboard di gestione per l'host, prenotazioni servizi extra, email
automatiche, e integrazione con i canali di prenotazione.

## Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, lucide-react
- **Backend/DB**: Supabase (PostgreSQL + Row Level Security), Auth, Storage
- **Deploy**: qualunque hosting con supporto Node.js (vedi `DEPLOY-SERVERPLAN.md`
  per la guida specifica a Serverplan/Plesk)

## Struttura del progetto
```
app/
  page.jsx                 → landing (link a demo ospite / dashboard)
  g/[token]/page.jsx        → app ospite (guest welcome book)
  (dashboard)/dashboard/    → dashboard host
  api/webhooks/pms/         → webhook prenotazioni (sito/channel manager)
components/
  GuestWelcomeBook.jsx      → componente app ospite (dati mock, da collegare a Supabase)
  HostDashboard.jsx         → componente dashboard host (dati mock, da collegare a Supabase)
lib/supabase/
  client.js                 → client Supabase lato browser
  server.js                 → client Supabase lato server + service role
supabase/migrations/        → schema SQL completo, da eseguire in ordine su Supabase
```

## Avvio in locale
```bash
cp .env.example .env.local   # compila con le tue chiavi Supabase
npm install
npm run dev
```
Apri http://localhost:3000

## Stato attuale
I componenti `GuestWelcomeBook.jsx` e `HostDashboard.jsx` funzionano
attualmente con **dati mock** (finti), per mostrare l'interfaccia e il
comportamento. Il prossimo passo è collegarli alle query Supabase reali
(sostituire gli array `useState` con `fetch`/query al posto dei dati
statici in cima ai file).

## Deploy
Vedi `DEPLOY-SERVERPLAN.md` per la guida passo-passo su Serverplan.
