import { isIsoDate } from '#lib/calendar.js';
import { EXAM_CFU_MAX, EXAM_CFU_MIN, EXAM_NAME_MAX, normalizeExamName } from '#lib/exam-rules.js';
import {
	NOTES_MAX,
	PASS_MIN,
	TEACHER_MAX,
	isSufficient,
	parseGradeJson
} from '#lib/grade-rules.js';
import { IMPORT_MAX_BYTES, IMPORT_MAX_ITEMS } from '#lib/import-rules.js';
import { parseDifficulty } from '#lib/difficulty-rules.js';

/** @typedef {import('./exams.js').ImportEntry} ImportEntry */
/** @typedef {import('./exams.js').ImportError} ImportError */

/**
 * Testo facoltativo: stringa (vuota = assente) o null.
 * @param {unknown} value
 * @returns {string | null | undefined} undefined se non e' una stringa
 */
function optionalText(value) {
	if (value === undefined || value === null) return null;
	if (typeof value !== 'string') return undefined;
	return value.trim() || null;
}

/**
 * Legge e valida il testo JSON da importare, senza toccare il database.
 * Gli errori di ogni elemento sono raccolti tutti, con la riga (posizione nell'elenco, da 1).
 * `row: 0` indica un errore sull'intero testo.
 * @param {string} text
 * @param {string} today data di oggi `YYYY-MM-DD`: le date successive non sono ammesse
 * @returns {{ ok: true, entries: ImportEntry[] } | { ok: false, errors: ImportError[] }}
 */
export function parseImport(text, today) {
	/** @param {string} key @param {Record<string, string | number>} [params] */
	const fatal = (key, params) => ({
		ok: /** @type {const} */ (false),
		errors: [{ row: 0, key, params }]
	});

	if (!text.trim()) return fatal('import.errors.empty');
	if (Buffer.byteLength(text, 'utf8') > IMPORT_MAX_BYTES)
		return fatal('import.errors.tooLarge', { max: IMPORT_MAX_BYTES / 1024 });

	/** @type {unknown} */
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return fatal('import.errors.invalidJson');
	}
	if (!Array.isArray(data)) return fatal('import.errors.notArray');
	if (data.length === 0 || data.length > IMPORT_MAX_ITEMS)
		return fatal('import.errors.count', { max: IMPORT_MAX_ITEMS });

	/** @type {ImportError[]} */
	const errors = [];
	/** @type {ImportEntry[]} */
	const entries = [];

	data.forEach((item, index) => {
		const row = index + 1;
		/** @param {string} key @param {Record<string, string | number>} [params] */
		const add = (key, params) => errors.push({ row, key, params });

		if (item === null || typeof item !== 'object' || Array.isArray(item)) {
			add('import.errors.notObject');
			return;
		}
		const raw = /** @type {Record<string, unknown>} */ (item);
		const before = errors.length;

		const name = typeof raw.name === 'string' ? normalizeExamName(raw.name) : '';
		if (!name) add('import.errors.nameRequired');
		else if (name.length > EXAM_NAME_MAX) add('import.errors.nameTooLong', { max: EXAM_NAME_MAX });

		const cfu = raw.cfu;
		const cfuValid =
			typeof cfu === 'number' &&
			Number.isInteger(cfu) &&
			cfu >= EXAM_CFU_MIN &&
			cfu <= EXAM_CFU_MAX;
		if (!cfuValid) add('import.errors.cfuInvalid', { min: EXAM_CFU_MIN, max: EXAM_CFU_MAX });

		const date = raw.date;
		if (!isIsoDate(date)) add('import.errors.dateInvalid');
		else if (date > today) add('import.errors.dateFuture');

		const grade = 'grade' in raw ? parseGradeJson(raw.grade) : undefined;
		if (!('grade' in raw)) add('import.errors.gradeMissing');
		else if (grade === undefined) add('import.errors.gradeInvalid');

		const rejected = raw.rejected ?? false;
		if (typeof rejected !== 'boolean') add('import.errors.rejectedInvalid');
		else if (rejected && grade !== undefined && !isSufficient(grade))
			add('import.errors.rejectedInsufficient', { min: PASS_MIN });

		const teacher = optionalText(raw.teacher);
		if (teacher === undefined) add('import.errors.teacherInvalid', { max: TEACHER_MAX });
		else if (teacher && teacher.length > TEACHER_MAX)
			add('import.errors.teacherInvalid', { max: TEACHER_MAX });

		const difficulty = parseDifficulty(raw.difficulty);
		if (difficulty === undefined) add('import.errors.difficultyInvalid');

		const notes = optionalText(raw.notes);
		if (notes === undefined) add('import.errors.notesInvalid', { max: NOTES_MAX });
		else if (notes && notes.length > NOTES_MAX)
			add('import.errors.notesInvalid', { max: NOTES_MAX });

		if (errors.length > before) return;
		entries.push({
			row,
			name,
			cfu: /** @type {number} */ (cfu),
			date: /** @type {string} */ (date),
			grade: /** @type {number | null} */ (grade),
			rejected: /** @type {boolean} */ (rejected),
			teacher: teacher ?? null,
			difficulty: difficulty ?? null,
			notes: notes ?? null
		});
	});

	return errors.length > 0 ? { ok: false, errors } : { ok: true, entries };
}
