import { redirect } from '@sveltejs/kit';
import { isLang } from '#lib/i18n/index.js';

/**
 * Imposta il cookie `lang` e torna alla pagina di provenienza.
 * Funziona anche senza JavaScript (form POST classico).
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ request, cookies }) {
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

	// solo percorsi interni, per evitare open redirect
	const safe =
		typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/';
	redirect(303, safe);
}
