import { redirect } from '@sveltejs/kit';
import { isLang } from '#lib/i18n/index.js';

/**
 * Imposta il cookie `lang` e torna alla pagina di provenienza.
 * Funziona anche senza JavaScript (form POST classico).
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, cookies, url }) {
	const form = await request.formData();
	const lang = form.get('lang');
	const target = form.get('redirectTo');

	if (isLang(lang)) {
		cookies.set('lang', lang, {
			path: '/',
			httpOnly: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 365
		});
	}

	redirect(303, safeRedirect(target, url));
}

/**
 * Percorso interno a cui tornare, per evitare open redirect: il valore si risolve
 * rispetto all'URL della richiesta (come farebbe il browser, che normalizza ad
 * esempio `/\evil.com` in `//evil.com`) e si accetta solo se l'origin resta la stessa.
 * @param {FormDataEntryValue | null} target
 * @param {URL} base
 */
function safeRedirect(target, base) {
	if (typeof target !== 'string' || !target) return '/';
	try {
		const resolved = new URL(target, base);
		if (resolved.origin !== base.origin) return '/';
		// `/.//evil.com` si risolve con pathname `//evil.com`, che il browser leggerebbe
		// come URL di un altro host: si riducono le barre iniziali a una sola
		const pathname = resolved.pathname.replace(/^\/+/, '/');
		return pathname + resolved.search + resolved.hash;
	} catch {
		return '/';
	}
}
