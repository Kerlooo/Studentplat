# Studentplat

[English version](README.en.md)

Piattaforma web per studenti universitari per tenere traccia del proprio percorso di studi: giorni di studio, esami da sostenere, esami sostenuti con voto e CFU, media aritmetica e ponderata, grafico dell'andamento dei voti.

## Funzionalità

Disponibili:

- Registrazione e login con sessione persistente (30 giorni)
- Dashboard accessibile solo agli utenti autenticati
- Interfaccia in italiano e inglese, con selettore della lingua
- Tema chiaro e scuro automatico

In sviluppo:

- Calendario dei giorni di studio e degli esami da sostenere
- Libretto con esami sostenuti, voti e CFU
- Media aritmetica e ponderata, grafico dei voti e statistiche sul rendimento

Ogni utente vede e modifica solo i propri dati.

## Stack

| Livello  | Tecnologia                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | [Svelte 5](https://svelte.dev) (runes)                                     |
| Backend  | [SvelteKit 3](https://svelte.dev/docs/kit) con adapter-node                |
| Stile    | CSS puro con custom properties, nessun framework                           |
| Database | MySQL / MariaDB tramite [mysql2](https://github.com/sidorares/node-mysql2) |
| Qualità  | Prettier, ESLint, svelte-check (tipi via JSDoc)                            |

L'autenticazione è implementata senza librerie esterne: password con hash scrypt (`node:crypto`), sessioni salvate su database con solo l'hash SHA-256 del token, cookie `httpOnly`.

## Requisiti

- Node.js 22 o superiore
- MySQL o MariaDB

## Installazione

```sh
npm install
cp .env.example .env          # configura le credenziali del database
mariadb -u <utente> < db/schema.sql
npm run dev
```

Il sito è disponibile su http://localhost:5173.

### Variabili d'ambiente

| Variabile     | Default       | Descrizione            |
| ------------- | ------------- | ---------------------- |
| `DB_HOST`     | `localhost`   | Host del server MySQL  |
| `DB_PORT`     | `3306`        | Porta del server MySQL |
| `DB_USER`     |               | Utente MySQL           |
| `DB_PASSWORD` | vuota         | Password MySQL         |
| `DB_NAME`     | `studentplat` | Nome del database      |

In produzione, con adapter-node, va impostata anche `ORIGIN` (es. `https://studentplat.example`) e il sito deve essere servito in HTTPS.

## Comandi

| Comando           | Descrizione              |
| ----------------- | ------------------------ |
| `npm run dev`     | Server di sviluppo       |
| `npm run build`   | Build di produzione      |
| `npm run preview` | Anteprima della build    |
| `npm run check`   | Controllo dei tipi       |
| `npm run lint`    | Prettier ed ESLint       |
| `npm run format`  | Formattazione automatica |

## Struttura

```
db/schema.sql              schema del database
src/
  hooks.server.js          sessione utente e lingua
  env.js                   dichiarazione delle variabili d'ambiente
  app.css                  design system e stili globali
  lib/
    components/            componenti Svelte
    i18n/                  traduzioni (it.json sorgente, en.json)
    server/                accesso al database e autenticazione
  routes/
    +page.svelte           homepage con login e registrazione
    dashboard/             area riservata
    lang/                  cambio lingua
```

## Traduzioni

L'italiano è la lingua sorgente. I testi visibili non sono scritti nei componenti ma in `src/lib/i18n/it.json` ed `en.json`, con le stesse chiavi; nei componenti si usano tramite `getT()`.
