import { formatDate } from '#lib/calendar.js';

/**
 * Valore testuale di un campo del form, senza spazi ai bordi ('' se manca).
 * @param {FormDataEntryValue | null} value
 */
export const str = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Id numerico positivo (INT UNSIGNED), altrimenti null.
 * @param {FormDataEntryValue | null} value
 */
export function parseId(value) {
	const text = str(value);
	if (!/^\d{1,10}$/.test(text)) return null;
	const id = Number(text);
	return id > 0 && id <= 4294967295 ? id : null;
}

/** Data di oggi `YYYY-MM-DD` secondo l'orologio del server. */
export function today() {
	const now = new Date();
	return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}
