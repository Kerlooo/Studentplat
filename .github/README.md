<div align="center">

# Studentplat

**Il libretto universitario online, con i conti già fatti.**

Registra gli esami sostenuti e quelli che ti aspettano: Studentplat calcola la media aritmetica e ponderata sui CFU, la base di laurea e ti mostra come stanno andando i voti.

[![Svelte 5](https://img.shields.io/badge/svelte-5-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev)
[![SvelteKit 3](https://img.shields.io/badge/sveltekit-3-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/docs/kit)
[![MariaDB / MySQL](https://img.shields.io/badge/database-MariaDB%20%2F%20MySQL-003545?logo=mariadb&logoColor=white)](https://mariadb.org)
[![Node.js 22+](https://img.shields.io/badge/node-22%2B-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Lingue: IT / EN](https://img.shields.io/badge/lingue-IT%20%2F%20EN-1E3A8A)](#lingue)

[English version](README.en.md) •
[Funzionalità](#funzionalità) •
[Installazione](#installazione) •
[Import degli esami](#import-degli-esami) •
[Sicurezza](#sicurezza) •
[Sviluppo](#sviluppo)

<img src="media/home.png" alt="Homepage di Studentplat con un esempio di libretto: tre esami, media aritmetica 27,33 e ponderata 27,67" width="100%">

</div>

---

Studentplat fa una cosa sola: tiene il libretto. Niente social, niente appunti condivisi, niente gamification. Inserisci un esame una volta, con i suoi CFU, e da lì in poi ogni voto aggiorna medie, grafico e statistiche. Il 30 e lode vale 31, come nei calcoli dell'università.

Ogni utente vede e modifica solo i propri dati. Il progetto è pensato per girare in locale, sul tuo computer, con un database MariaDB o MySQL.

## Funzionalità

- **Libretto completo.** Ogni esame con CFU, docente, difficoltà percepita e lo storico di tutti i tentativi: voto, ritirato o assente, insufficiente, voto rifiutato. Un esame risulta superato solo con un voto sufficiente e non rifiutato.
- **Medie sempre aggiornate.** Media aritmetica, media ponderata sui CFU e base di laurea in centodecimi (ponderata x 110 / 30), ricalcolate a ogni voto.
- **Andamento dei voti.** Grafico esame per esame con la linea della media ponderata cumulativa, distribuzione dei voti per fasce ed esiti dei tentativi, inclusa la percentuale di esami passati al primo colpo.
- **Calendario degli appelli.** Vista mensile in cui fissare, spostare o togliere un appello, registrare l'esito e creare nuovi esami al volo.
- **Panoramica.** I prossimi tre appelli e i CFU ottenuti rispetto al totale del corso, appena entri.
- **Import da JSON.** Porta dentro in un colpo gli esami già sostenuti o quelli ancora da fare, invece di inserirli uno a uno.
- **Catalogo condiviso.** Gli esami (nome + CFU) sono un catalogo comune: chi aggiunge "Analisi matematica I, 12 CFU" lo rende disponibile a tutti, ma voti e date restano privati.
- **Pannello di amministrazione.** Statistiche del sito, gestione degli utenti (ruolo, chiusura delle sessioni, cancellazione) e del catalogo, con unione dei doppioni.
- **Italiano e inglese.** Interfaccia completa nelle due lingue, con selettore sempre visibile.
- **Tema chiaro e scuro.** Segue automaticamente le preferenze del sistema.
- **Funziona anche senza JavaScript.** Form classici e conferme in due passi: il sito resta usabile anche con gli script disattivati.

## Installazione

Servono **Node.js 22+** e **MariaDB** o **MySQL**.

```sh
git clone https://github.com/Kerlooo/Studentplat.git
cd Studentplat
npm install
cp .env.example .env              # credenziali del database
mariadb -u <utente> < db/schema.sql
npm run dev
```

Il sito è su http://localhost:5173. Lo schema crea il database `studentplat` e tutte le tabelle, e si può rilanciare senza perdere dati.

### Variabili d'ambiente

| Variabile     | Default       | Descrizione            |
| ------------- | ------------- | ---------------------- |
| `DB_HOST`     | `localhost`   | Host del server MySQL  |
| `DB_PORT`     | `3306`        | Porta del server MySQL |
| `DB_USER`     |               | Utente MySQL           |
| `DB_PASSWORD` | vuota         | Password MySQL         |
| `DB_NAME`     | `studentplat` | Nome del database      |

### Primo amministratore

Il ruolo di amministratore si assegna a mano, una volta sola. Gli altri admin si nominano poi dal pannello `/admin`.

```sql
UPDATE studentplat.users SET role = 'admin' WHERE email = 'tu@esempio.it';
```

## Import degli esami

Da **Profilo > Importa esami** si incolla un elenco JSON. Tutto viene controllato prima di salvare: con un solo errore non si scrive nulla e la pagina indica la riga sbagliata.

Esami sostenuti (`grade` da 1 a 30, sotto il 18 non superato; `"30L"` per la lode, `null` per ritirato o assente; `rejected` per un voto rifiutato):

```json
[
	{
		"name": "Analisi matematica I",
		"cfu": 12,
		"date": "2025-02-10",
		"grade": 28,
		"teacher": "Mario Rossi",
		"difficulty": "hard"
	},
	{ "name": "Programmazione", "cfu": 9, "date": "2025-06-20", "grade": "30L" },
	{ "name": "Fisica", "cfu": 6, "date": "2025-07-01", "grade": 24, "rejected": true }
]
```

Esami da sostenere (data dell'appello facoltativa):

```json
[
	{ "name": "Basi di dati", "cfu": 9, "date": "2026-01-28" },
	{ "name": "Sistemi operativi", "cfu": 12, "difficulty": "medium" }
]
```

Limiti: 200 righe e 100 KB per import.

## Sicurezza

L'autenticazione è scritta senza librerie esterne, usando solo `node:crypto`.

- **Password:** hash scrypt con salt casuale, confronto a tempo costante. Il login impiega lo stesso tempo anche quando l'email non esiste, così non rivela chi è registrato.
- **Sessioni:** token casuale da 256 bit nel cookie (`httpOnly`, `SameSite=Lax`, `Secure` fuori dallo sviluppo). Nel database c'è solo il suo hash SHA-256: chi legge la tabella non può impersonare nessuno.
- **Tentativi limitati:** dopo 5 password sbagliate per la stessa email, o 20 dallo stesso indirizzo, il login si blocca per 15 minuti.
- **Header di sicurezza:** Content Security Policy con nonce, protezione dal clickjacking, `nosniff`. La protezione CSRF è quella integrata in SvelteKit.
- **Dati isolati:** ogni query su esami e tentativi è filtrata per l'utente autenticato e ogni pagina riservata controlla la sessione, non solo il layout.

## Sviluppo

| Comando           | Descrizione                |
| ----------------- | -------------------------- |
| `npm run dev`     | Server di sviluppo         |
| `npm run check`   | Controllo dei tipi (JSDoc) |
| `npm run lint`    | Prettier ed ESLint         |
| `npm run format`  | Formattazione automatica   |
| `npm run build`   | Build di produzione (Node) |
| `npm run preview` | Anteprima della build      |

| Livello  | Tecnologia                                                                 |
| -------- | -------------------------------------------------------------------------- |
| Frontend | [Svelte 5](https://svelte.dev) (runes)                                     |
| Backend  | [SvelteKit 3](https://svelte.dev/docs/kit) con adapter-node                |
| Stile    | CSS puro con custom properties, nessun framework                           |
| Database | MariaDB / MySQL tramite [mysql2](https://github.com/sidorares/node-mysql2) |

```
db/schema.sql              schema del database
src/
  hooks.server.js          sessione, lingua e header di sicurezza
  lib/
    components/            componenti Svelte, uno per file
    i18n/                  traduzioni (it.json sorgente, en.json)
    server/                database, autenticazione, query
    stats.js               calcolo di medie e statistiche
  routes/
    dashboard/             area riservata: panoramica, calendario, libretto, statistiche, profilo
    admin/                 pannello di amministrazione
    login/                 accesso e registrazione
```

### Lingue

L'italiano è la lingua sorgente. I testi visibili non sono scritti nei componenti ma in `src/lib/i18n/it.json` ed `en.json`, con le stesse chiavi, e si usano tramite `getT()`. Una nuova chiave va aggiunta in entrambi i file.

## Autore

Realizzato da Carlo, studente di Scienze e Tecnologie Informatiche. Segnalazioni e suggerimenti sono benvenuti nelle [issue](https://github.com/Kerlooo/Studentplat/issues).
