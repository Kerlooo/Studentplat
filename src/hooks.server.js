import { building } from '$app/env';
import { DEFAULT_LANG, isLang } from '#lib/i18n/index.js';
import {
	SESSION_COOKIE,
	deleteSessionCookie,
	setSessionCookie,
	startSessionCleanup,
	validateSession
} from '#lib/server/auth.js';

/** Header aggiunti a ogni response. */
const SECURITY_HEADERS = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'same-origin'
};

/** @type {import('@sveltejs/kit/hooks').ServerInit} */
export function init() {
	// durante la build SvelteKit esegue l'app per analizzarla: niente timer ne' accessi al DB
	if (!building) startSessionCleanup();
}

/** @type {import('@sveltejs/kit/hooks').Handle} */
export async function handle({ event, resolve }) {
	const lang = event.cookies.get('lang');
	event.locals.lang = isLang(lang) ? lang : DEFAULT_LANG;
	event.locals.user = null;

	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const session = await validateSession(token);
		if (session) {
			event.locals.user = session.user;
			if (session.renewed) setSessionCookie(event.cookies, token, session.expiresAt);
		} else {
			deleteSessionCookie(event.cookies);
		}
	}

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});

	// header di sicurezza (la CSP la genera SvelteKit, vedi `csp` in vite.config.js);
	// try/catch perché alcune response, ad esempio da fetch, hanno header immutabili
	try {
		for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
			response.headers.set(name, value);
		}
	} catch {
		// header non modificabili: si lascia la response com'è
	}
	return response;
}
