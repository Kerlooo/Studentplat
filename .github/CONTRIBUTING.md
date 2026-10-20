# Contribuire a Studentplat

_[English below](#contributing-to-studentplat-english)_

Grazie per l'interesse! Segnalazioni, idee e pull request sono benvenute. Partecipando accetti il [codice di condotta](CODE_OF_CONDUCT.md).

## Prima di iniziare

- **Bug:** apri una [issue](https://github.com/Kerlooo/Studentplat/issues/new/choose) con il modulo "Segnalazione bug", indicando i passi per riprodurlo.
- **Nuove funzionalità:** apri prima una issue con il modulo "Proposta di funzionalità", così ne parliamo prima che tu scriva codice.
- **Vulnerabilità:** non aprire una issue pubblica, segui la [politica di sicurezza](SECURITY.md).

## Ambiente di sviluppo

Servono Node.js 22+ e MariaDB o MySQL. I passi sono nel [README](README.md#installazione).

```sh
npm install
cp .env.example .env
mariadb -u <utente> < db/schema.sql
npm run dev
```

## Regole del codice

- **Testi tradotti.** Nessun testo visibile scritto direttamente nei componenti: va in `src/lib/i18n/it.json` (sorgente) ed `en.json`, con la stessa chiave, e si usa con `getT()`. Ogni chiave nuova va aggiunta in entrambi i file.
- **Componenti.** Le parti di pagina riusabili (form, navigazioni, tabelle) vanno in `src/lib/components/`, un componente per file, con lo stile scoped nel componente.
- **Stile.** Solo CSS puro, nessun framework. Colori, spaziature e tipografia vengono dalle custom properties in `src/app.css`, che reggono anche il tema scuro.
- **Database solo lato server.** Le query stanno in `src/lib/server/` e usano sempre parametri (`?`), mai valori concatenati nel testo SQL.
- **Dati isolati.** Ogni query su esami e tentativi va filtrata per l'utente autenticato. Ogni `load` e ogni action sotto `/dashboard` chiama `requireUser(locals)`, sotto `/admin` `requireAdmin(locals)`: il controllo nel layout da solo non protegge le action.
- **Senza JavaScript.** I form devono funzionare anche con gli script disattivati (form action di SvelteKit, `use:enhance` come miglioramento).
- **Tipi.** Il progetto è in JavaScript con tipi JSDoc: `npm run check` deve passare senza errori.
- **Modifiche allo schema.** Vanno in `db/schema.sql` in forma rieseguibile (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), così chi ha già il database lo aggiorna senza perdere dati.

## Prima di aprire una pull request

```sh
npm run format
npm run check
npm run lint
npm run build
```

Tutti e quattro devono andare a buon fine. Poi:

- un commit per modifica logica, con un messaggio breve e riassuntivo, in italiano (es. `Calendario: sposta un appello con trascinamento`);
- descrivi nella pull request cosa cambia e come l'hai provato, con screenshot se tocchi l'interfaccia (meglio se in tema chiaro e scuro);
- collega la issue di riferimento (`Closes #12`).

---

# Contributing to Studentplat (English)

Thanks for your interest! Bug reports, ideas and pull requests are welcome. By taking part you agree to the [code of conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Bugs:** open an [issue](https://github.com/Kerlooo/Studentplat/issues/new/choose) with the "Bug report" form, including the steps to reproduce it.
- **New features:** open an issue with the "Feature request" form first, so we can discuss it before you write code.
- **Vulnerabilities:** do not open a public issue, follow the [security policy](SECURITY.md).

## Development environment

You need Node.js 22+ and MariaDB or MySQL. The steps are in the [README](README.en.md#install).

## Code rules

- **Translated text.** No visible text written directly in components: it goes into `src/lib/i18n/it.json` (source) and `en.json`, under the same key, and is used through `getT()`. Every new key goes into both files.
- **Components.** Reusable page parts (forms, navigation, tables) live in `src/lib/components/`, one component per file, with scoped styles.
- **Styling.** Plain CSS only, no framework. Colours, spacing and typography come from the custom properties in `src/app.css`, which also drive the dark theme.
- **Database on the server only.** Queries live in `src/lib/server/` and always use parameters (`?`), never values concatenated into SQL.
- **Isolated data.** Every query on exams and attempts is filtered by the authenticated user. Every `load` and action under `/dashboard` calls `requireUser(locals)`, under `/admin` `requireAdmin(locals)`: the layout check alone does not protect actions.
- **No JavaScript required.** Forms must work with scripts disabled (SvelteKit form actions, `use:enhance` as an enhancement).
- **Types.** The project is JavaScript with JSDoc types: `npm run check` must pass with no errors.
- **Schema changes.** Go into `db/schema.sql` in a re-runnable form (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), so existing databases upgrade without losing data.

## Before opening a pull request

Run `npm run format`, `npm run check`, `npm run lint` and `npm run build`: all four must succeed. Then:

- one commit per logical change, with a short summary message;
- describe in the pull request what changes and how you tested it, with screenshots if you touch the interface (ideally in both light and dark theme);
- link the related issue (`Closes #12`).
