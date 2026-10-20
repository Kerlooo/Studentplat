import { isIsoDate } from '#lib/calendar.js';
import {
	EXAM_CFU_MAX,
	EXAM_CFU_MIN,
	EXAM_NAME_MAX,
	examSearchKey,
	normalizeExamName
} from '#lib/exam-rules.js';
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
/** @typedef {import('./exams.js').PlannedImportEntry} PlannedImportEntry */
/** @typedef {import('./exams.js').ImportError} ImportError */
/** @typedef {(key: string, params?: Record<string, string | number>) => void} AddError */

/**
 * @template T
 * @typedef {{ ok: true, entries: T[] } | { ok: false, errors: ImportError[] }} ParseResult
 */

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
 * Testo facoltativo con lunghezza massima; segnala `key` se non valido.
 * @param {unknown} value
 * @param {number} max
 * @param {string} key
 * @param {AddError} add
 * @returns {string | null}
 */
function readOptionalText(value, max, key, add) {
	const text = optionalText(value);
	if (text === undefined || (text && text.length > max)) {
		add(key, { max });
		return null;
	}
	return text;
}

/**
 * Nome dell'esame normalizzato ('' se mancante o non valido).
 * @param {unknown} value
 * @param {AddError} add
 */
function readName(value, add) {
	const name = typeof value === 'string' ? normalizeExamName(value) : '';
	if (!name) add('import.errors.nameRequired');
	else if (name.length > EXAM_NAME_MAX) {
		add('import.errors.nameTooLong', { max: EXAM_NAME_MAX });
		return '';
	}
	return name;
}

/**
 * CFU interi nei limiti del catalogo (null se non validi).
 * @param {unknown} value
 * @param {AddError} add
 * @returns {number | null}
 */
function readCfu(value, add) {
	if (
		typeof value === 'number' &&
		Number.isInteger(value) &&
		value >= EXAM_CFU_MIN &&
		value <= EXAM_CFU_MAX
	)
		return value;
	add('import.errors.cfuInvalid', { min: EXAM_CFU_MIN, max: EXAM_CFU_MAX });
	return null;
}

/**
 * @param {unknown} value
 * @param {AddError} add
 */
const readTeacher = (value, add) =>
	readOptionalText(value, TEACHER_MAX, 'import.errors.teacherInvalid', add);

/**
 * @param {unknown} value
 * @param {AddError} add
 */
function readDifficulty(value, add) {
	const difficulty = parseDifficulty(value);
	if (difficulty === undefined) add('import.errors.difficultyInvalid');
	return difficulty ?? null;
}

/**
 * Controlli sull'intero testo e lettura dell'elenco; poi ogni elemento oggetto passa
 * a `parseItem`, che segnala gli errori con `add`. Gli errori sono raccolti tutti,
 * con la riga (posizione nell'elenco, da 1); `row: 0` indica un errore sull'intero testo.
 * Un elemento con errori non entra nel risultato.
 * @template T
 * @param {string} text
 * @param {(raw: Record<string, unknown>, row: number, add: AddError) => T} parseItem
 * @returns {ParseResult<T>}
 */
function parseList(text, parseItem) {
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
	/** @type {T[]} */
	const entries = [];

	data.forEach((item, index) => {
		const row = index + 1;
		/** @type {AddError} */
		const add = (key, params) => {
			errors.push({ row, key, params });
		};

		if (item === null || typeof item !== 'object' || Array.isArray(item)) {
			add('import.errors.notObject');
			return;
		}
		const before = errors.length;
		const entry = parseItem(/** @type {Record<string, unknown>} */ (item), row, add);
		if (errors.length === before) entries.push(entry);
	});

	return errors.length > 0 ? { ok: false, errors } : { ok: true, entries };
}

/**
 * Legge e valida il testo JSON degli esami sostenuti, senza toccare il database.
 * @param {string} text
 * @param {string} today data di oggi `YYYY-MM-DD`: le date successive non sono ammesse
 * @returns {ParseResult<ImportEntry>}
 */
export function parseImport(text, today) {
	return parseList(text, (raw, row, add) => {
		const name = readName(raw.name, add);
		const cfu = readCfu(raw.cfu, add);

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

		const teacher = readTeacher(raw.teacher, add);
		const difficulty = readDifficulty(raw.difficulty, add);
		const notes = readOptionalText(raw.notes, NOTES_MAX, 'import.errors.notesInvalid', add);

		// I cast valgono solo se la riga non ha errori (altrimenti viene scartata)
		return {
			row,
			name,
			cfu: /** @type {number} */ (cfu),
			date: /** @type {string} */ (date),
			grade: /** @type {number | null} */ (grade),
			rejected: /** @type {boolean} */ (rejected),
			teacher,
			difficulty,
			notes
		};
	});
}

/**
 * Legge e valida il testo JSON degli esami da sostenere, senza toccare il database.
 * Lo stesso esame (nome senza distinzione di maiuscole e accenti, e CFU) non puo'
 * comparire due volte nell'elenco.
 * @param {string} text
 * @returns {ParseResult<PlannedImportEntry>}
 */
export function parsePlannedImport(text) {
	/** @type {Map<string, number>} chiave dell'esame -> prima riga in cui compare */
	const seen = new Map();

	return parseList(text, (raw, row, add) => {
		const name = readName(raw.name, add);
		const cfu = readCfu(raw.cfu, add);

		const date = raw.date ?? null;
		if (date !== null && !isIsoDate(date)) add('import.errors.dateInvalid');

		const teacher = readTeacher(raw.teacher, add);
		const difficulty = readDifficulty(raw.difficulty, add);

		if (name && cfu !== null) {
			const key = `${examSearchKey(name)}|${cfu}`;
			const other = seen.get(key);
			if (other) add('import.errors.duplicateRow', { other });
			else seen.set(key, row);
		}

		return {
			row,
			name,
			cfu: /** @type {number} */ (cfu),
			date: /** @type {string | null} */ (date),
			teacher,
			difficulty
		};
	});
}
