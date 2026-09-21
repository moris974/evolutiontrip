# EvolutionTrip – Dashboard gestionale

Dashboard per la gestione dei consigli e dei servizi destinati agli ospiti di una struttura ricettiva.
È una pagina statica (HTML, Tailwind CSS e JavaScript): non richiede installazione né server.

## Come vederla in locale

Apri il file `index.html` nel browser. Serve la connessione a internet, perché Tailwind CSS e i font
vengono caricati da CDN.

## Come pubblicarla con GitHub Pages

1. Crea un nuovo repository su GitHub e carica i file di questa cartella (`index.html` e `README.md`).
2. Vai in **Settings → Pages**.
3. In **Build and deployment** scegli **Deploy from a branch**, seleziona il branch `main` e la cartella `/ (root)`, poi salva.
4. Dopo qualche minuto la dashboard è online all'indirizzo `https://<tuo-utente>.github.io/<nome-repository>/`.

## Cosa contiene

- Sidebar con logo EvolutionTrip e menu: Dashboard, Consigli, Statistiche sui consigli, Prenotazioni, Messaggi,
  Email automatiche, Abbonamento, Ordini, Impostazioni, Assistenza.
- Dashboard con le schede riepilogative (consigli, servizi, email, informazioni utili), link e volantino dell'APP,
  selettore del colore e chat di assistenza.
- Pagine collegate alle schede: Servizi, Informazioni utili, Email di invito e Guida alla configurazione.
- Interfaccia responsive (menu a scomparsa su mobile) e tema scuro automatico per i colori neutri.

## Palette

| Uso | Colore |
| --- | --- |
| Sidebar | `#310e80` |
| Accento e voce di menu attiva | `#db5c70` |
| Pulsante avvisi | `#5314b3` |
| Sfondo contenuto | `#f8f9fa` |

I colori sono definiti come variabili CSS all'inizio del file, nel blocco `:root`.

## Cartella `taste-skill-main`

Pacchetto di skill di design aggiunto al progetto e incluso senza modifiche. Non è usato dalla dashboard:
`index.html` funziona anche senza. La cartella ha una propria licenza (file `LICENSE` al suo interno).
Se preferisci tenerla separata, puoi spostarla in un altro repository.

## Limiti attuali

- **Dati di esempio:** consigli, prenotazioni, messaggi e ordini sono dati fittizi definiti nell'oggetto `state` in fondo al file.
- **Nessun salvataggio:** le modifiche restano solo finché la pagina è aperta; ricaricando tornano i dati iniziali.
- **Funzioni simulate:** anteprima dell'APP, download del volantino e del QR code mostrano soltanto un avviso. Il QR code è decorativo e non si può scansionare.
- **Tailwind da CDN:** va bene per prototipi e demo. Per un uso in produzione conviene compilare Tailwind, così da non dipendere dal CDN.
