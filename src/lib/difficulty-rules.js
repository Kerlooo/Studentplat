/** Difficolta' personale di un esame del libretto, condivisa tra client e server. */

/** @typedef {'easy' | 'medium' | 'hard'} Difficulty */

/** @type {readonly Difficulty[]} */
export const DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * @param {unknown} value
 * @returns {value is Difficulty}
 */
export const isDifficulty = (value) =>
	typeof value === 'string' && /** @type {readonly string[]} */ (DIFFICULTIES).includes(value);

/**
 * Valore del campo `difficulty`: vuoto (o assente) = non indicata (null),
 * valore valido = la difficolta', altro = undefined (non valido).
 * @param {unknown} value
 * @returns {Difficulty | null | undefined}
 */
export function parseDifficulty(value) {
	if (value === undefined || value === null) return null;
	if (typeof value !== 'string') return undefined;
	const text = value.trim();
	if (!text) return null;
	return isDifficulty(text) ? text : undefined;
}
