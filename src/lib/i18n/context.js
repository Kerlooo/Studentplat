import { getContext, setContext } from 'svelte';
import { translate } from './index.js';

const KEY = Symbol('i18n');

/**
 * @typedef {(key: string, params?: import('./index.js').TranslateParams) => string} Translator
 */

/**
 * Da chiamare nel layout radice: `getLang` deve leggere un valore reattivo
 * (es. `data.lang`), così le traduzioni si aggiornano al cambio lingua.
 * @param {() => import('./index.js').Lang} getLang
 */
export function setI18n(getLang) {
	setContext(KEY, getLang);
}

/**
 * Restituisce la funzione `t(key, params)` per la lingua corrente.
 * Va chiamata durante l'inizializzazione del componente.
 * @returns {Translator}
 */
export function getT() {
	/** @type {() => import('./index.js').Lang} */
	const getLang = getContext(KEY);
	return (key, params) => translate(getLang(), key, params);
}

/**
 * Restituisce una funzione che formatta i numeri secondo la lingua corrente
 * (es. 27,33 in italiano, 27.33 in inglese).
 * Va chiamata durante l'inizializzazione del componente.
 * @param {Intl.NumberFormatOptions} [options]
 * @returns {(n: number) => string}
 */
export function getNumberFormat(options) {
	/** @type {() => import('./index.js').Lang} */
	const getLang = getContext(KEY);
	return (n) => new Intl.NumberFormat(getLang(), options).format(n);
}
