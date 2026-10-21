import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export function load({ locals, url }) {
	if (locals.user) redirect(303, '/dashboard');
	// Dopo l'eliminazione dell'account la sessione non c'e' piu': si arriva qui con l'avviso
	return { accountDeleted: url.searchParams.get('accountDeleted') === '1' };
}
