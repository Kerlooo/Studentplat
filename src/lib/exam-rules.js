/** Regole degli esami del catalogo, condivise tra client (attributi HTML, suggerimenti) e server. */
export const EXAM_NAME_MAX = 150;
export const EXAM_CFU_MIN = 1;
export const EXAM_CFU_MAX = 30;

/**
 * Nome come verra' salvato: senza spazi ai bordi e con gli spazi multipli ridotti a uno.
 * @param {string} name
 */
export function normalizeExamName(name) {
	return name.trim().replace(/\s+/g, ' ');
}

/**
 * Chiave di confronto che approssima la collation `utf8mb4_unicode_ci` del database
 * (maiuscole e accenti non contano): serve per la ricerca e per segnalare i doppioni.
 * @param {string} text
 */
export function examSearchKey(text) {
	return normalizeExamName(text).normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
}
