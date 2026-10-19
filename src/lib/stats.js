/**
 * Statistiche del libretto: funzioni pure, condivise tra client e server.
 *
 * Input: gli esami del libretto (`TranscriptExam`, vedi `#lib/server/exams.js`)
 * e i CFU totali del corso dal profilo. Output: soli numeri e stringhe, serializzabili.
 * Il 30 e lode (31) vale 31 in tutte le medie.
 */

import { GRADE_LODE, PASS_MIN, attemptOutcome } from '#lib/grade-rules.js';

/** @typedef {import('#lib/server/exams.js').TranscriptExam} TranscriptExam */

/** @typedef {{ name: string, cfu: number, date: string, grade: number }} PassedExam */

/**
 * @typedef {{
 * 	arithmetic: number,
 * 	weighted: number,
 * 	graduationBase: number,
 * }} Averages
 */

/** @typedef {{ min: number, max: number, count: number }} GradeBand */

/**
 * @typedef {{
 * 	passed: number,
 * 	toTake: number,
 * 	earnedCfu: number,
 * 	totalCfu: number | null,
 * 	highest: number | null,
 * 	lowest: number | null,
 * 	lodes: number,
 * 	distribution: GradeBand[],
 * }} Summary
 */

/**
 * @typedef {{
 * 	total: number,
 * 	passed: number,
 * 	withdrawn: number,
 * 	failed: number,
 * 	rejected: number,
 * 	firstTry: number,
 * 	firstTryRate: number | null,
 * }} AttemptStats
 */

/**
 * @typedef {{
 * 	date: string,
 * 	name: string,
 * 	cfu: number,
 * 	grade: number,
 * 	cumulativeWeighted: number,
 * }} TrendPoint
 */

/**
 * @typedef {{
 * 	averages: Averages | null,
 * 	summary: Summary,
 * 	attempts: AttemptStats,
 * 	trend: TrendPoint[],
 * }} Stats
 */

/** Fasce della distribuzione dei voti (estremi inclusi); l'ultima e' il 30 e lode. */
export const GRADE_BANDS = /** @type {const} */ ([
	[PASS_MIN, 20],
	[21, 23],
	[24, 26],
	[27, 29],
	[30, 30],
	[GRADE_LODE, GRADE_LODE]
]);

/** Voto massimo della laurea: la base si ottiene riportando la media ponderata su 110. */
const GRADUATION_MAX = 110;
const GRADE_SCALE = 30;

/** @param {number} value */
const round1 = (value) => Math.round(value * 10) / 10;

/**
 * Esami superati in ordine di data; a parita' di data, per nome.
 * @param {TranscriptExam[]} exams
 * @returns {PassedExam[]}
 */
export function passedExams(exams) {
	return exams
		.flatMap((exam) =>
			exam.passed
				? [{ name: exam.name, cfu: exam.cfu, date: exam.passed.date, grade: exam.passed.grade }]
				: []
		)
		.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name) || a.cfu - b.cfu);
}

/**
 * Media aritmetica, ponderata sui CFU e base di laurea (ponderata * 110 / 30, a un decimale).
 * Senza esami superati restituisce null.
 * @param {PassedExam[]} passed
 * @returns {Averages | null}
 */
export function computeAverages(passed) {
	if (passed.length === 0) return null;
	let gradeSum = 0;
	let weightedSum = 0;
	let cfuSum = 0;
	for (const exam of passed) {
		gradeSum += exam.grade;
		weightedSum += exam.grade * exam.cfu;
		cfuSum += exam.cfu;
	}
	const weighted = weightedSum / cfuSum;
	return {
		arithmetic: gradeSum / passed.length,
		weighted,
		graduationBase: round1((weighted * GRADUATION_MAX) / GRADE_SCALE)
	};
}

/**
 * Riepilogo del libretto: esami, CFU, voti estremi, lodi e distribuzione per fasce.
 * @param {TranscriptExam[]} exams
 * @param {PassedExam[]} passed
 * @param {number | null} totalCfu
 * @returns {Summary}
 */
export function computeSummary(exams, passed, totalCfu) {
	const grades = passed.map((exam) => exam.grade);
	return {
		passed: passed.length,
		toTake: exams.length - passed.length,
		earnedCfu: passed.reduce((sum, exam) => sum + exam.cfu, 0),
		totalCfu: totalCfu && totalCfu > 0 ? totalCfu : null,
		highest: grades.length > 0 ? Math.max(...grades) : null,
		lowest: grades.length > 0 ? Math.min(...grades) : null,
		lodes: grades.filter((grade) => grade === GRADE_LODE).length,
		distribution: GRADE_BANDS.map(([min, max]) => ({
			min,
			max,
			count: grades.filter((grade) => grade >= min && grade <= max).length
		}))
	};
}

/**
 * Esiti di tutti i tentativi e quota di esami superati al primo tentativo
 * (esami superati con un solo tentativo in tutto / esami superati; null se nessuno).
 * @param {TranscriptExam[]} exams
 * @returns {AttemptStats}
 */
export function computeAttemptStats(exams) {
	const stats = { total: 0, passed: 0, withdrawn: 0, failed: 0, rejected: 0 };
	let passedCount = 0;
	let firstTry = 0;
	for (const exam of exams) {
		for (const attempt of exam.attempts) {
			stats.total++;
			stats[attemptOutcome(attempt)]++;
		}
		if (exam.passed) {
			passedCount++;
			if (exam.attempts.length === 1) firstTry++;
		}
	}
	return {
		...stats,
		firstTry,
		firstTryRate: passedCount > 0 ? firstTry / passedCount : null
	};
}

/**
 * Andamento: per ogni esame superato, in ordine, il voto e la media ponderata fino a quel punto.
 * @param {PassedExam[]} passed
 * @returns {TrendPoint[]}
 */
export function computeTrend(passed) {
	let weightedSum = 0;
	let cfuSum = 0;
	return passed.map((exam) => {
		weightedSum += exam.grade * exam.cfu;
		cfuSum += exam.cfu;
		return { ...exam, cumulativeWeighted: weightedSum / cfuSum };
	});
}

/**
 * Tutte le statistiche della pagina Statistiche.
 * @param {TranscriptExam[]} exams
 * @param {number | null} totalCfu
 * @returns {Stats}
 */
export function computeStats(exams, totalCfu) {
	const passed = passedExams(exams);
	return {
		averages: computeAverages(passed),
		summary: computeSummary(exams, passed, totalCfu),
		attempts: computeAttemptStats(exams),
		trend: computeTrend(passed)
	};
}
