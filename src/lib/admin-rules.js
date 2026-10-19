/** Regole del pannello admin condivise tra client e server. */

/** Righe per pagina negli elenchi di utenti ed esami. */
export const ADMIN_PAGE_SIZE = 50;

/** Lunghezza massima del testo cercato. */
export const ADMIN_SEARCH_MAX = 100;

/**
 * Fuso orario con cui il pannello mostra data e ora di registrazione e ultimo accesso:
 * fisso, cosi' server e browser producono lo stesso testo.
 */
export const ADMIN_TIME_ZONE = 'Europe/Rome';

/**
 * Ricerca e pagina di un elenco dai parametri `q` e `page` dell'URL.
 * Pagina non valida: 1 (quella oltre l'ultima la riporta indietro il server).
 * @param {URLSearchParams} params
 */
export function readListParams(params) {
	const q = (params.get('q') ?? '').trim().replace(/\s+/g, ' ').slice(0, ADMIN_SEARCH_MAX);
	const raw = params.get('page') ?? '';
	const page = /^\d{1,6}$/.test(raw) ? Math.max(1, Number(raw)) : 1;
	return { q, page };
}

/**
 * Indirizzo di una pagina dell'elenco con la ricerca corrente (prima pagina senza `page`).
 * @param {string} path percorso gia' risolto
 * @param {string} q
 * @param {number} page
 */
export function listHref(path, q, page) {
	const params = new URLSearchParams();
	if (q) params.set('q', q);
	if (page > 1) params.set('page', String(page));
	const query = params.toString();
	return query ? `${path}?${query}` : path;
}
