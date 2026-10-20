# Politica di sicurezza

_[English below](#security-policy-english)_

## Versioni supportate

Studentplat non ha ancora release numerate: le correzioni di sicurezza arrivano solo sul branch `master`.

## Segnalare una vulnerabilità

**Non aprire una issue pubblica.** Usa la segnalazione privata di GitHub: scheda [Security > Report a vulnerability](https://github.com/Kerlooo/Studentplat/security/advisories/new).

Indica, se puoi:

- la parte del sito coinvolta (pagina, action, file);
- i passi per riprodurre il problema;
- l'impatto: cosa può fare chi la sfrutta (leggere dati di altri utenti, prendere il controllo di un account, ecc.);
- una possibile correzione, se ne hai una in mente.

Riceverai una prima risposta entro una settimana. Una volta corretta la vulnerabilità, la segnalazione verrà resa pubblica, con un ringraziamento a chi l'ha trovata se lo desidera.

## Ambito

Rientrano nell'ambito, per esempio: accesso ai dati di un altro utente, aggiramento dell'autenticazione o dei permessi admin, XSS, CSRF, SQL injection, open redirect, debolezze nella gestione di password e sessioni.

Il progetto è pensato per l'uso locale. Restano fuori dall'ambito i problemi che dipendono solo dalla configurazione del server su cui lo si installa (HTTPS, firewall, credenziali del database).

---

# Security policy (English)

## Supported versions

Studentplat has no numbered releases yet: security fixes land on the `master` branch only.

## Reporting a vulnerability

**Do not open a public issue.** Use GitHub's private reporting: [Security > Report a vulnerability](https://github.com/Kerlooo/Studentplat/security/advisories/new).

If you can, include:

- the affected part of the site (page, action, file);
- steps to reproduce;
- the impact: what an attacker could do (read other users' data, take over an account, etc.);
- a possible fix, if you have one in mind.

You will get a first reply within a week. Once fixed, the report will be published, crediting the reporter if they wish.

## Scope

In scope, for example: access to another user's data, bypassing authentication or admin permissions, XSS, CSRF, SQL injection, open redirect, weaknesses in password and session handling.

The project is meant for local use. Issues that depend only on the configuration of the server it is installed on (HTTPS, firewall, database credentials) are out of scope.
