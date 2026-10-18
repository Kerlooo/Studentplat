/**
 * Utilita' per date di calendario in formato ISO (`YYYY-MM-DD`, mese `YYYY-MM`).
 * Le date si costruiscono in UTC e si formattano con `timeZone: 'UTC'`, cosi' il
 * giorno non cambia mai per effetto del fuso orario del server o del browser.
 */

export const YEAR_MIN = 1970;
export const YEAR_MAX = 2100;

/** @typedef {{ year: number, month: number }} YearMonth month: 1-12 */

/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0');

/** @param {YearMonth} ym */
export const formatMonth = ({ year, month }) => `${year}-${pad(month)}`;

/**
 * @param {number} year
 * @param {number} month 1-12
 * @param {number} day
 */
export const formatDate = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

/**
 * @param {string | null | undefined} value
 * @returns {YearMonth | null}
 */
export function parseMonth(value) {
	const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	if (year < YEAR_MIN || year > YEAR_MAX || month < 1 || month > 12) return null;
	return { year, month };
}

/**
 * Data reale nel formato `YYYY-MM-DD` (rifiuta ad esempio il 31 aprile).
 * @param {unknown} value
 * @returns {value is string}
 */
export function isIsoDate(value) {
	if (typeof value !== 'string') return false;
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
	if (!match) return false;
	const [year, month, day] = match.slice(1).map(Number);
	if (year < YEAR_MIN || year > YEAR_MAX) return false;
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Data ISO -> `Date` a mezzanotte UTC, da formattare con `timeZone: 'UTC'`.
 * @param {string} iso
 */
export function isoToUtcDate(iso) {
	const [year, month, day] = iso.split('-').map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

/**
 * @param {YearMonth} ym
 * @param {number} delta
 * @returns {YearMonth}
 */
export function shiftMonth({ year, month }, delta) {
	const index = year * 12 + (month - 1) + delta;
	return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

/**
 * Settimane del mese, da lunedi' a domenica. Le caselle fuori dal mese sono `null`.
 * @param {YearMonth} ym
 * @returns {(string | null)[][]}
 */
export function monthWeeks({ year, month }) {
	const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
	// getUTCDay: 0 = domenica; spostato perche' la settimana parte dal lunedi'
	const leading = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;

	/** @type {(string | null)[]} */
	const cells = Array(leading).fill(null);
	for (let day = 1; day <= daysInMonth; day++) cells.push(formatDate(year, month, day));
	while (cells.length % 7 !== 0) cells.push(null);

	const weeks = [];
	for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
	return weeks;
}

/**
 * Date UTC di una settimana qualsiasi da lunedi' a domenica, per i nomi dei giorni.
 * Il 5 gennaio 1970 era un lunedi'.
 */
export const WEEKDAY_SAMPLES = Array.from(
	{ length: 7 },
	(_, i) => new Date(Date.UTC(1970, 0, 5 + i))
);
