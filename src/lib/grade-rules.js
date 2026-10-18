/**
 * Regole dei voti e dei tentativi d'esame, condivise tra client e server.
 *
 * - `grade` va da 1 a 30; 31 = 30 e lode (vale 31 nelle medie); null = ritirato/assente.
 * - Sotto 18 l'esame non e' superato.
 * - `rejected` (voto rifiutato) ha senso solo con un voto sufficiente.
 * - Un esame e' superato se ha un tentativo sufficiente e non rifiutato; al massimo uno per esame.
 */

export const GRADE_MIN = 1;
export const GRADE_MAX = 30;
export const GRADE_LODE = 31;
export const PASS_MIN = 18;
export const NOTES_MAX = 255;
export const TEACHER_MAX = 150;

/** Valore del campo voto dei form per "ritirato o assente". */
export const GRADE_ABSENT = 'absent';

/**
 * @typedef {{
 * 	id: number,
 * 	userExamId: number,
 * 	examId: number,
 * 	date: string,
 * 	grade: number | null,
 * 	rejected: boolean,
 * 	notes: string | null,
 * }} Attempt
 */

/** @typedef {'passed' | 'rejected' | 'failed' | 'withdrawn'} AttemptOutcome */
/** @typedef {'passed' | 'failed' | 'pending'} ExamStatus */

/** Voti selezionabili, dal 30 e lode all'1. */
export const GRADE_OPTIONS = Array.from({ length: GRADE_LODE }, (_, i) => GRADE_LODE - i);

/**
 * @param {unknown} grade
 * @returns {grade is number | null}
 */
export function isValidGrade(grade) {
	return (
		grade === null ||
		(typeof grade === 'number' &&
			Number.isInteger(grade) &&
			grade >= GRADE_MIN &&
			grade <= GRADE_LODE)
	);
}

/** @param {number | null} grade */
export const isSufficient = (grade) => grade !== null && grade >= PASS_MIN;

/** @param {{ grade: number | null, rejected: boolean }} attempt */
export const isPassing = (attempt) => isSufficient(attempt.grade) && !attempt.rejected;

/**
 * @param {{ grade: number | null, rejected: boolean }} attempt
 * @returns {AttemptOutcome}
 */
export function attemptOutcome(attempt) {
	if (attempt.grade === null) return 'withdrawn';
	if (!isSufficient(attempt.grade)) return 'failed';
	return attempt.rejected ? 'rejected' : 'passed';
}

/**
 * Voto dal campo di un form: numero 1-31, `30L` o `absent`.
 * @param {string} value
 * @returns {number | null | undefined} undefined se non valido
 */
export function parseGradeField(value) {
	const text = value.trim();
	if (text === GRADE_ABSENT) return null;
	if (/^30l$/i.test(text)) return GRADE_LODE;
	if (!/^\d{1,2}$/.test(text)) return undefined;
	const grade = Number(text);
	return isValidGrade(grade) ? grade : undefined;
}

/**
 * Voto da un'importazione JSON: intero 1-31, la stringa "30L" (maiuscole indifferenti) o null.
 * @param {unknown} value
 * @returns {number | null | undefined} undefined se non valido
 */
export function parseGradeJson(value) {
	if (value === null) return null;
	if (typeof value === 'string') return /^\s*30l\s*$/i.test(value) ? GRADE_LODE : undefined;
	return isValidGrade(value) ? value : undefined;
}

/**
 * Voto in forma breve: il numero, oppure `lode` (es. "30L") per il 30 e lode.
 * Ritirato/assente non ha forma numerica: restituisce null.
 * @param {number | null} grade
 * @param {string} lode
 */
export function formatGrade(grade, lode) {
	if (grade === null) return null;
	return grade === GRADE_LODE ? lode : String(grade);
}

/**
 * Il tentativo che rende superato l'esame, se c'e'.
 * @template {{ grade: number | null, rejected: boolean }} T
 * @param {T[]} attempts
 * @returns {T | null}
 */
export function passingAttempt(attempts) {
	return attempts.find(isPassing) ?? null;
}

/**
 * Stato dell'esame dai suoi tentativi: superato, non superato (tentativi senza successo)
 * o da sostenere (nessun tentativo).
 * @param {{ grade: number | null, rejected: boolean }[]} attempts
 * @returns {ExamStatus}
 */
export function examStatus(attempts) {
	if (passingAttempt(attempts)) return 'passed';
	return attempts.length > 0 ? 'failed' : 'pending';
}
