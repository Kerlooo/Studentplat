import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, deleteSessionCookie, invalidateSession } from '#lib/server/auth.js';

/**
 * Chiude la sessione corrente e torna alla vetrina pubblica.
 * Form POST classico: la navigazione completa azzera anche lo stato del client.
 * La protezione CSRF di SvelteKit (controllo dell'origine) vale anche qui.
 * @type {import('./$types').RequestHandler}
 */
export async function POST({ cookies, locals }) {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await invalidateSession(token);
	deleteSessionCookie(cookies);
	locals.user = null;
	redirect(303, '/');
}
