// Limitatore di tentativi in memoria a finestra fissa.
// Pensato per un solo processo (uso locale): al riavvio i contatori si azzerano.

/**
 * @typedef {object} RateLimiter
 * @property {(key: string) => boolean} isLimited true se la chiave ha esaurito i tentativi
 * @property {(key: string) => void} hit conta un tentativo per la chiave
 * @property {(key: string) => void} reset azzera il contatore della chiave
 */

/** Ogni quante operazioni si ripuliscono le voci scadute. */
const SWEEP_EVERY = 100;

/**
 * Crea un limitatore: al massimo `max` tentativi per chiave ogni `windowMs` millisecondi.
 * @param {{ max: number, windowMs: number }} options
 * @returns {RateLimiter}
 */
export function createRateLimiter({ max, windowMs }) {
	/** @type {Map<string, { count: number, resetAt: number }>} */
	const entries = new Map();
	let operations = 0;

	/** Elimina le voci con finestra scaduta, così la Map non cresce senza limite. */
	function sweep(/** @type {number} */ now) {
		for (const [key, entry] of entries) {
			if (entry.resetAt <= now) entries.delete(key);
		}
	}

	/**
	 * Voce ancora valida per la chiave (null se assente o scaduta).
	 * @param {string} key
	 * @param {number} now
	 */
	function current(key, now) {
		if (++operations % SWEEP_EVERY === 0) sweep(now);
		const entry = entries.get(key);
		if (!entry) return null;
		if (entry.resetAt <= now) {
			entries.delete(key);
			return null;
		}
		return entry;
	}

	return {
		isLimited(key) {
			const entry = current(key, Date.now());
			return entry !== null && entry.count >= max;
		},
		hit(key) {
			const now = Date.now();
			const entry = current(key, now);
			if (entry) entry.count += 1;
			else entries.set(key, { count: 1, resetAt: now + windowMs });
		},
		reset(key) {
			entries.delete(key);
		}
	};
}
