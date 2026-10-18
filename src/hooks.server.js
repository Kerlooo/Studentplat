import { DEFAULT_LANG, isLang } from '#lib/i18n/index.js';
import {
	SESSION_COOKIE,
	deleteSessionCookie,
	setSessionCookie,
	validateSession
} from '#lib/server/auth.js';

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

	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
}
