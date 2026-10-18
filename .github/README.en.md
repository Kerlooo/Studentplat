# Studentplat

[Versione italiana](README.md)

A web platform for university students to keep track of their studies: study days, upcoming exams, passed exams with grades and credits (CFU), arithmetic and weighted average, and a chart of grade trends.

## Features

Available:

- Sign up and log in with a persistent session (30 days)
- Dashboard restricted to authenticated users
- Italian and English interface with a language switcher
- Automatic light and dark theme

In progress:

- Calendar of study days and upcoming exams
- Transcript with passed exams, grades and credits
- Arithmetic and weighted average, grade chart and performance statistics

Each user can only see and edit their own data.

## Stack

| Layer    | Technology                                                             |
| -------- | ---------------------------------------------------------------------- |
| Frontend | [Svelte 5](https://svelte.dev) (runes)                                 |
| Backend  | [SvelteKit 3](https://svelte.dev/docs/kit) with adapter-node           |
| Styling  | Plain CSS with custom properties, no framework                         |
| Database | MySQL / MariaDB via [mysql2](https://github.com/sidorares/node-mysql2) |
| Quality  | Prettier, ESLint, svelte-check (JSDoc types)                           |

Authentication uses no external libraries: passwords are hashed with scrypt (`node:crypto`), sessions are stored in the database as the SHA-256 hash of the token only, and the cookie is `httpOnly`.

## Requirements

- Node.js 22 or later
- MySQL or MariaDB

## Setup

```sh
npm install
cp .env.example .env          # set the database credentials
mariadb -u <user> < db/schema.sql
npm run dev
```

The site runs at http://localhost:5173.

### Environment variables

| Variable      | Default       | Description       |
| ------------- | ------------- | ----------------- |
| `DB_HOST`     | `localhost`   | MySQL server host |
| `DB_PORT`     | `3306`        | MySQL server port |
| `DB_USER`     |               | MySQL user        |
| `DB_PASSWORD` | empty         | MySQL password    |
| `DB_NAME`     | `studentplat` | Database name     |

In production with adapter-node, `ORIGIN` must also be set (e.g. `https://studentplat.example`) and the site must be served over HTTPS.

## Commands

| Command           | Description         |
| ----------------- | ------------------- |
| `npm run dev`     | Development server  |
| `npm run build`   | Production build    |
| `npm run preview` | Preview the build   |
| `npm run check`   | Type checking       |
| `npm run lint`    | Prettier and ESLint |
| `npm run format`  | Auto-formatting     |

## Structure

```
db/schema.sql              database schema
src/
  hooks.server.js          user session and language
  env.js                   environment variable declarations
  app.css                  design system and global styles
  lib/
    components/            Svelte components
    i18n/                  translations (it.json source, en.json)
    server/                database access and authentication
  routes/
    +page.svelte           homepage with login and sign-up
    dashboard/             private area
    lang/                  language switch
```

## Translations

Italian is the source language. User-facing text is not written in components but in `src/lib/i18n/it.json` and `en.json`, sharing the same keys; components access it via `getT()`.
