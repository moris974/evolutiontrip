# EvolutionTrip — Riepilogo completo del progetto

Incolla questo documento all'inizio della nuova conversazione con Claude,
insieme al file `evolutiontrip-nextjs.zip`, per ripartire esattamente da
dove eravamo rimasti senza perdere nulla.

---

## Cos'è il progetto

SaaS web/PWA ispirata a **BBTips** (Digital Welcome Book e Reception
Digitale per B&B, Hotel, Case Vacanza), rinominata **EvolutionTrip**.
Due interfacce principali:
1. **App ospite** — la guida digitale che vede chi soggiorna nella struttura
2. **Dashboard host** — il pannello con cui la struttura gestisce tutto

## Stack tecnico
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, lucide-react
- **Backend/DB**: Supabase (PostgreSQL + Row Level Security per multi-tenancy)
- **Deploy consigliato**: GitHub + Vercel (piano gratuito), in alternativa
  Serverplan/Plesk (guida inclusa nello zip: `DEPLOY-SERVERPLAN.md`)

## Identità e brand
- Nome app: **EvolutionTrip**
- Logo: icona a forma di percorso/rotta (non testo), stile bussola
- Colori: header Home **azzurro** (`#3F8FCB`), schermata login **blu pieno**
  (`#1F4E79`), accento **`#D0AC80`** (oro/tan), rosso/terracotta (`#C2542E`)
  per i pulsanti principali, verde salvia (`#2F5D62`) come colore secondario
- Sidebar dashboard: **azzurra**
- Nome struttura demo usato nei mock: "La tua Reception on line"

## Struttura del progetto (nello zip)
```
app/                      → route Next.js (landing, /g/[token], /dashboard, webhook)
components/
  GuestWelcomeBook.jsx     → app ospite completa (ancora a dati mock)
  HostDashboard.jsx        → dashboard host completa (ancora a dati mock)
lib/supabase/              → client Supabase (browser + server)
supabase/migrations/       → 12 file SQL, da eseguire in ordine su Supabase
server.js                  → server Node custom per hosting Plesk/Serverplan
DEPLOY-SERVERPLAN.md       → guida deploy specifica
README.md                  → istruzioni avvio locale
```

## Funzionalità già costruite (app ospite)

- **Login**: 3 modalità — numero prenotazione + cognome, registrazione
  email+password, password dimenticata
- **Home**: ricalca la Home reale di BBTips (screenshot fornito dall'utente)
  — barra superiore con chat/logo/bandiera lingua, banner "Scarica app",
  banner avvisi, scheda struttura, righe Orari/Servizi/Informazioni utili,
  sezione "I Nostri Consigli" con carosello, scorciatoie a Itinerario e
  Feedback
- **Bottom nav a 4 voci**: Home / Consigli / Itinerario / Struttura
- **Consigli & luoghi**: categorie Mangiare/Spiagge/Da vedere/Shopping,
  sconti, consiglio personalizzato host
- **Itinerario**: raccoglie Escursioni & tour, Fiere & eventi, Menù
- **Struttura**: indirizzo, mappa con pin e "Ottieni indicazioni", orari,
  Wi-Fi, foto camere, social, Chiama/Campanello reception, feedback
- **Servizi extra**: incluso parcheggio coperto ed esterno, prenotazione
- **Fiere & eventi**: incluse due fiere reali di Rimini Fiera (TTG Travel
  Experience, SIA Hospitality Design), link ufficiale, tasto condividi
- **Escursioni & tour**: durata, difficoltà, punto di ritrovo, link,
  condividi
- **Menù**: colazione/mezza pensione/pensione completa, calendario
  prenotazione tavolo
- **Chat** con la reception
- **Feedback** post-soggiorno (stelle + commento)
- **Selettore lingua**: IT / EN / RU
- **Schermata "struttura bloccata"**: se l'abbonamento dell'host scade

## Funzionalità già costruite (dashboard host)

- **Accesso host**: registrazione nuova struttura (prova gratuita 14gg),
  login, password dimenticata
- **Dati struttura**: anagrafica, orari, Wi-Fi, regole casa, numeri
  emergenza, **posizione geografica obbligatoria** (lat/long + mappa),
  foto copertina e logo struttura (upload reale funzionante), social,
  **link pubblico della struttura** (`app.evolutiontrip.it/app/?structureID=`)
  con copia link, apri come ospite, QR code
- **Consigli & luoghi**: CRUD completo con foto, link ufficiale
- **Fiere & eventi**: CRUD con categoria, date, foto, link
- **Escursioni**: CRUD con durata/difficoltà/prezzo/foto/link
- **Menù**: per colazione/mezza pensione/pensione completa, scelta tra
  caricare un PDF o costruirlo piatto per piatto
- **Servizi extra**: CRUD con foto, incluso parcheggio coperto/esterno
- **Prenotazioni**: stato pending/confirmed/declined, tasto WhatsApp
- **Messaggi**: chat con gli ospiti, thread prioritario per il
  "campanello reception"
- **Email & automazioni**: template pre-checkin/durante/post-checkout
- **Ospiti**: elenco soggiorni, canale di provenienza (Booking.com,
  Airbnb, sito diretto, altra agenzia — ciascuno con scheda di
  collegamento dedicata), motivo del soggiorno (fiera/lavoro, famiglia,
  coppia...) per individuare clienti fedeli
- **Panoramica**: statistiche (card centrate), feedback ricevuti,
  lingue disponibili, sorgenti collegate
- **Impostazioni app**: nome app, logo (upload reale), colori,
  interruttori per attivare/disattivare ogni sezione dell'app ospite
- **Abbonamento**: 3 piani (Base/Pro/Multistruttura) con nome, prezzo e
  attivo/disattivo tutti modificabili; prova gratuita con giorni
  modificabili e link condivisibile; storico pagamenti; blocco
  automatico o manuale per mancato rinnovo (per Multistruttura, blocco
  selettivo per singola struttura); link di pagamento verso checkout

## Schema database (12 migration SQL, in `supabase/migrations/`)
0001 schema iniziale (profiles, properties, categories, places, services,
guest_stays, bookings, email_templates, notifications) + RLS · 0002 numero
prenotazione · 0003 messages/feedback/traduzioni/statistiche · 0004 account
ospiti email+password · 0005 canali prenotazione (Booking/Airbnb/sito/altro)
· 0006 motivo soggiorno + fiere&eventi · 0007 menù + escursioni · 0008
social/camere/link/calendario menù · 0009 foto eventi · 0010 campanello
reception · 0011 abbonamenti + prova gratuita 14gg · 0012 storico pagamenti
+ blocco struttura

## Cosa manca ancora (prossimi passi onesti)
1. **Collegare i componenti a Supabase reale** — oggi usano dati mock
   (array `useState` in cima ai file): va sostituito con query vere
2. **Autenticazione reale** — i form di login/registrazione (sia ospite
   che host) validano solo il formato, non c'è ancora Supabase Auth vero
3. **Upload immagini reali** — oggi usano `URL.createObjectURL` (anteprima
   locale), va collegato a Supabase Storage
4. **Pagamenti reali** — serve integrare Stripe (o altro) dietro ai
   pulsanti/link di pagamento già presenti
5. **Canali OTA reali** — Booking.com/Airbnb richiedono un channel
   manager terzo (Smoobu, Octorate, Beds24...) come intermediario, non
   hanno API dirette per app indipendenti
6. **Funzione BBTips non ancora replicata**: sistema di "link di
   affiliazione" con commissioni (funzione di business, non essenziale)

## Preferenze di lavoro da ricordare
- Mostrare sempre l'anteprima di front (app ospite) e back (dashboard)
  ad ogni modifica
- Verificare il codice (sintassi + rendering reale) prima di presentarlo,
  non solo a occhio
