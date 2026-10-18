import it from './it.json';
import en from './en.json';

/** @typedef {'it' | 'en'} Lang */
/** @typedef {Record<string, string | number>} TranslateParams */

/** @type {Lang} */
export const DEFAULT_LANG = 'it';

/** @type {readonly Lang[]} */
export const LANGS = ['it', 'en'];

/** @type {Record<Lang, Record<string, unknown>>} */
const dictionaries = { it, en };

/**
 * @param {unknown} value
 * @returns {value is Lang}
 */
export function isLang(value) {
	return typeof value === 'string' && /** @type {readonly string[]} */ (LANGS).includes(value);
}

/**
 * @param {Record<string, unknown>} dict
 * @param {string} key
 */
function lookup(dict, key) {
	/** @type {unknown} */
	let node = dict;
	for (const part of key.split('.')) {
		if (node === null || typeof node !== 'object') return undefined;
		node = /** @type {Record<string, unknown>} */ (node)[part];
	}
	return typeof node === 'string' ? node : undefined;
}

/**
 * Traduce una chiave (es. `auth.login.title`) nella lingua indicata, sostituendo i
 * segnaposto `{nome}` con i valori di `params`. Se la chiave manca si ricade
 * sull'italiano e infine sulla chiave stessa.
 * @param {Lang} lang
 * @param {string} key
 * @param {TranslateParams} [params]
 */
export function translate(lang, key, params) {
	const text = lookup(dictionaries[lang], key) ?? lookup(dictionaries[DEFAULT_LANG], key) ?? key;
	if (!params) return text;
	return text.replace(/\{(\w+)\}/g, (match, name) =>
		name in params ? String(params[name]) : match
	);
}
