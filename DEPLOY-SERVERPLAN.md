# Pubblicare EvolutionTrip su Serverplan (Plesk)

## 0. Prerequisito
Verifica con il supporto Serverplan che il tuo piano abbia il modulo
**Node.js** attivo in Plesk (spesso disponibile solo su piani Cloud/VPS,
non sull'hosting condiviso base per WordPress/PHP).

## 1. Crea il progetto Supabase (il database)
1. Vai su https://supabase.com, crea un nuovo progetto.
2. Apri **SQL Editor** ed esegui, in ordine, tutti i file dentro
   `supabase/migrations/` (dal numero più basso al più alto: 0001, 0002...).
3. Da **Project Settings > API** copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (tienila segreta)

## 2. Prepara il progetto in locale
```bash
npm install
npm run build
```
Verifica che non ci siano errori. Questo crea la cartella `.next/`.

## 3. Carica i file su Serverplan
In Plesk, sotto **Siti Web e Domini > [tuo dominio] > File**, oppure via
FTP/SFTP (credenziali fornite da Serverplan), carica **tutto il progetto
tranne** `node_modules/` (verrà installata direttamente sul server) e
`.env` (le variabili si impostano dal pannello, vedi punto 5).

## 4. Configura l'app Node.js in Plesk
Sempre in **Siti Web e Domini**, apri la sezione **Node.js** e imposta:
- **Application Root**: la cartella dove hai caricato il progetto
- **Application Startup File**: `server.js`
- **Application Mode**: `production`
- **Document Root**: lasciare quello di default del dominio

Poi clicca **"Esegui npm install"** direttamente dal pannello Plesk (installa
le dipendenze usando il Node.js del server).

## 5. Variabili d'ambiente
Nella stessa schermata Node.js di Plesk, sezione **Variabili d'ambiente**,
aggiungi tutte quelle elencate in `.env.example` con i valori reali
(Supabase, Resend, eventualmente Twilio).

## 6. Avvia e collega il dominio
1. Clicca **"Riavvia App"**.
2. Sotto **Hosting e DNS > SSL/TLS**, attiva un certificato **Let's Encrypt**
   gratuito per avere HTTPS (obbligatorio: Supabase Auth non funziona su
   connessioni non sicure).
3. Se vuoi usare un sottodominio dedicato (es. `app.evolutiontrip.it`),
   crealo da **Siti Web e Domini > Aggiungi sottodominio** prima di
   ripetere i passi 3-5 per quel sottodominio.

## 7. Verifica finale
- Apri `https://tuodominio.it/dashboard` → dovresti vedere la Dashboard Host.
- Apri `https://tuodominio.it/g/demo` → vedrai l'app ospite con dati mock
  (finché non è collegata a un vero `access_token` di Supabase).

## Nota su Booking.com/Airbnb
Il webhook in `app/api/webhooks/pms/route.js` è pronto per ricevere
prenotazioni dal sito diretto o da un channel manager (vedi
`supabase/migrations/0005_booking_channels.sql`). Booking.com e Airbnb non
offrono API dirette a integrazioni indipendenti: serve comunque un channel
manager (Smoobu, Octorate, Beds24...) come intermediario.
