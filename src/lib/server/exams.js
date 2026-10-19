import { db } from './db.js';
import { examSearchKey } from '#lib/exam-rules.js';
import { PASS_MIN, examStatus, isPassing, passingAttempt } from '#lib/grade-rules.js';
import { isoToUtcDate } from '#lib/calendar.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** @typedef {import('mysql2').RowDataPacket[]} Rows */
/** @typedef {import('mysql2').ResultSetHeader} Result */

/**
 * Voce del catalogo vista da un utente: i campi del libretto sono i suoi
 * (null se l'esame non e' nel suo libretto). Di chi ha creato l'esame non si espone nulla.
 * @typedef {{
 * 	id: number,
 * 	name: string,
 * 	cfu: number,
 * 	userExamId: number | null,
 * 	plannedDate: string | null,
 * 	passed: { date: string, grade: number } | null,
 * }} CatalogExam
 */

/** @typedef {import('#lib/grade-rules.js').Attempt} Attempt */

const ATTEMPT_COLUMNS = `a.id, a.user_exam_id, ue.exam_id,
	DATE_FORMAT(a.attempt_date, '%Y-%m-%d') AS attempt_date, a.grade, a.rejected, a.notes`;

/**
 * @param {import('mysql2').RowDataPacket} row
 * @returns {Attempt}
 */
const toAttempt = (row) => ({
	id: row.id,
	userExamId: row.user_exam_id,
	examId: row.exam_id,
	date: row.attempt_date,
	grade: row.grade ?? null,
	rejected: !!row.rejected,
	notes: row.notes ?? null
});

/**
 * Tutti i tentativi dell'utente, in ordine di data.
 * @param {number} userId
 * @returns {Promise<Attempt[]>}
 */
export async function getAttemptsForUser(userId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT ${ATTEMPT_COLUMNS}
			 FROM exam_attempts a JOIN user_exams ue ON ue.id = a.user_exam_id
			 WHERE ue.user_id = ?
			 ORDER BY a.attempt_date, a.id`,
			[userId]
		)
	);
	return rows.map(toAttempt);
}

/**
 * Raggruppa i tentativi per esame del libretto.
 * @param {Attempt[]} attempts
 */
function groupByUserExam(attempts) {
	/** @type {Map<number, Attempt[]>} */
	const map = new Map();
	for (const attempt of attempts) {
		const list = map.get(attempt.userExamId);
		if (list) list.push(attempt);
		else map.set(attempt.userExamId, [attempt]);
	}
	return map;
}

/**
 * @param {Attempt[] | undefined} attempts
 * @returns {{ date: string, grade: number } | null}
 */
function passedInfo(attempts) {
	const passing = passingAttempt(attempts ?? []);
	return passing && passing.grade !== null ? { date: passing.date, grade: passing.grade } : null;
}

/**
 * Catalogo condiviso con, per ogni esame, il libretto dell'utente indicato.
 * `plannedDate` e' gia' una stringa `YYYY-MM-DD` (niente conversioni di fuso).
 * Se gli servono, si passano i tentativi gia' letti per non rileggerli.
 * @param {number} userId
 * @param {Attempt[]} [attempts]
 * @returns {Promise<CatalogExam[]>}
 */
export async function getCatalogForUser(userId, attempts) {
	const byUserExam = groupByUserExam(attempts ?? (await getAttemptsForUser(userId)));
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT e.id, e.name, e.cfu, ue.id AS user_exam_id,
			        DATE_FORMAT(ue.planned_date, '%Y-%m-%d') AS planned_date
			 FROM exams e
			 LEFT JOIN user_exams ue ON ue.exam_id = e.id AND ue.user_id = ?
			 ORDER BY e.name, e.cfu`,
			[userId]
		)
	);
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		cfu: row.cfu,
		userExamId: row.user_exam_id ?? null,
		plannedDate: row.planned_date ?? null,
		passed: row.user_exam_id ? passedInfo(byUserExam.get(row.user_exam_id)) : null
	}));
}

/**
 * @param {number} examId
 * @returns {Promise<{ id: number, name: string, cfu: number } | null>}
 */
export async function getExam(examId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute('SELECT id, name, cfu FROM exams WHERE id = ?', [examId])
	);
	const row = rows[0];
	return row ? { id: row.id, name: row.name, cfu: row.cfu } : null;
}

/**
 * Aggiunge l'esame al catalogo. Se esiste gia' un esame con lo stesso nome e CFU
 * (confronto della collation: maiuscole e accenti non contano) riusa quello.
 * @param {number} userId
 * @param {string} name gia' normalizzato
 * @param {number} cfu
 * @returns {Promise<{ id: number, name: string, cfu: number, reused: boolean }>}
 */
export async function createExam(userId, name, cfu) {
	try {
		const [result] = /** @type {[Result, unknown]} */ (
			await db.execute('INSERT INTO exams (name, cfu, created_by) VALUES (?, ?, ?)', [
				name,
				cfu,
				userId
			])
		);
		return { id: result.insertId, name, cfu, reused: false };
	} catch (err) {
		if (/** @type {{ code?: string }} */ (err).code !== 'ER_DUP_ENTRY') throw err;
	}
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute('SELECT id, name, cfu FROM exams WHERE name = ? AND cfu = ?', [name, cfu])
	);
	const row = rows[0];
	if (!row) throw new Error('Esame duplicato non trovato');
	return { id: row.id, name: row.name, cfu: row.cfu, reused: true };
}

/**
 * Fissa l'appello dell'esame nel libretto dell'utente: lo aggiunge se manca,
 * altrimenti sposta solo la data.
 * @param {number} userId
 * @param {number} examId
 * @param {string} date `YYYY-MM-DD`
 * Un esame gia' superato non si sposta piu': in quel caso non scrive nulla.
 * @returns {Promise<{ status: 'added' | 'moved' | 'unchanged' | 'passed', previousDate: string | null }>}
 */
export async function scheduleExam(userId, examId, date) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT DATE_FORMAT(ue.planned_date, '%Y-%m-%d') AS planned_date,
			        EXISTS (SELECT 1 FROM exam_attempts a
			                WHERE a.user_exam_id = ue.id AND a.grade >= ? AND a.rejected = 0) AS passed
			 FROM user_exams ue WHERE ue.user_id = ? AND ue.exam_id = ?`,
			[PASS_MIN, userId, examId]
		)
	);
	const existing = rows[0];
	if (existing?.passed) return { status: 'passed', previousDate: existing.planned_date ?? null };

	// ON DUPLICATE KEY copre anche una richiesta concorrente arrivata tra SELECT e INSERT
	await db.execute(
		`INSERT INTO user_exams (user_id, exam_id, planned_date) VALUES (?, ?, ?)
		 ON DUPLICATE KEY UPDATE planned_date = VALUES(planned_date)`,
		[userId, examId, date]
	);

	if (!existing) return { status: 'added', previousDate: null };
	const previousDate = existing.planned_date ?? null;
	return { status: previousDate === date ? 'unchanged' : 'moved', previousDate };
}

/**
 * Toglie la data d'appello; l'esame resta nel libretto.
 * @param {number} userId
 * @param {number} userExamId
 * @returns {Promise<boolean>} false se la riga non esiste o non e' dell'utente
 */
export async function unscheduleExam(userId, userExamId) {
	const [result] = /** @type {[Result, unknown]} */ (
		await db.execute('UPDATE user_exams SET planned_date = NULL WHERE id = ? AND user_id = ?', [
			userExamId,
			userId
		])
	);
	return result.affectedRows > 0;
}

/**
 * Esame del libretto con i suoi tentativi, per la pagina Libretto.
 * @typedef {{
 * 	userExamId: number,
 * 	examId: number,
 * 	name: string,
 * 	cfu: number,
 * 	plannedDate: string | null,
 * 	teacher: string | null,
 * 	status: import('#lib/grade-rules.js').ExamStatus,
 * 	passed: { date: string, grade: number } | null,
 * 	attempts: Attempt[],
 * }} TranscriptExam
 */

/**
 * Libretto dell'utente: prima i superati in ordine di data, poi gli altri per appello e nome.
 * @param {number} userId
 * @returns {Promise<TranscriptExam[]>}
 */
export async function getTranscript(userId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT ue.id, ue.exam_id, e.name, e.cfu, ue.teacher,
			        DATE_FORMAT(ue.planned_date, '%Y-%m-%d') AS planned_date
			 FROM user_exams ue JOIN exams e ON e.id = ue.exam_id
			 WHERE ue.user_id = ?
			 ORDER BY e.name, e.cfu`,
			[userId]
		)
	);
	const byUserExam = groupByUserExam(await getAttemptsForUser(userId));

	/** @type {TranscriptExam[]} */
	const exams = rows.map((row) => {
		const attempts = byUserExam.get(row.id) ?? [];
		return {
			userExamId: row.id,
			examId: row.exam_id,
			name: row.name,
			cfu: row.cfu,
			plannedDate: row.planned_date ?? null,
			teacher: row.teacher ?? null,
			status: examStatus(attempts),
			passed: passedInfo(attempts),
			attempts
		};
	});

	// Date ISO: il confronto tra stringhe segue l'ordine cronologico
	const rank = (/** @type {TranscriptExam} */ exam) =>
		exam.passed ? `0${exam.passed.date}` : `1${exam.plannedDate ?? '9999-99-99'}`;
	return exams.sort((a, b) => rank(a).localeCompare(rank(b)));
}

/**
 * Registra un tentativo. La riga del libretto viene bloccata (FOR UPDATE) finche' la
 * transazione non finisce, cosi' due richieste insieme non possono superare due volte lo stesso esame.
 * @param {number} userId
 * @param {number} userExamId
 * @param {{ date: string, grade: number | null, rejected: boolean, notes: string | null }} attempt
 * @returns {Promise<
 * 	| { status: 'notFound' }
 * 	| { status: 'alreadyPassed', name: string, passed: { date: string, grade: number } }
 * 	| { status: 'added', id: number, name: string, cfu: number }
 * >}
 */
export async function addAttempt(userId, userExamId, attempt) {
	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		// Lock solo sulla voce del libretto: l'esame si legge senza lock, cosi' l'ordine
		// resta compatibile con cancellazione e unione dal pannello admin (prima exams, poi user_exams)
		const [locked] = /** @type {[Rows, unknown]} */ (
			await conn.execute('SELECT exam_id FROM user_exams WHERE id = ? AND user_id = ? FOR UPDATE', [
				userExamId,
				userId
			])
		);
		const [rows] = /** @type {[Rows, unknown]} */ (
			locked[0]
				? await conn.execute('SELECT name, cfu FROM exams WHERE id = ?', [locked[0].exam_id])
				: [[]]
		);
		const row = rows[0];
		if (!row) {
			await conn.rollback();
			return { status: 'notFound' };
		}

		if (isPassing(attempt)) {
			const [passed] = /** @type {[Rows, unknown]} */ (
				await conn.execute(
					`SELECT DATE_FORMAT(attempt_date, '%Y-%m-%d') AS attempt_date, grade
					 FROM exam_attempts WHERE user_exam_id = ? AND grade >= ? AND rejected = 0 LIMIT 1`,
					[userExamId, PASS_MIN]
				)
			);
			if (passed[0]) {
				await conn.rollback();
				return {
					status: 'alreadyPassed',
					name: row.name,
					passed: { date: passed[0].attempt_date, grade: passed[0].grade }
				};
			}
		}

		const [result] = /** @type {[Result, unknown]} */ (
			await conn.execute(
				`INSERT INTO exam_attempts (user_exam_id, attempt_date, grade, rejected, notes)
				 VALUES (?, ?, ?, ?, ?)`,
				[userExamId, attempt.date, attempt.grade, attempt.rejected, attempt.notes]
			)
		);
		await conn.commit();
		return { status: 'added', id: result.insertId, name: row.name, cfu: row.cfu };
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
}

/**
 * Elimina un tentativo, solo se appartiene al libretto dell'utente.
 * @param {number} userId
 * @param {number} attemptId
 * @returns {Promise<number | null>} l'esame del libretto a cui apparteneva, null se non trovato
 */
export async function deleteAttempt(userId, attemptId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT a.user_exam_id FROM exam_attempts a JOIN user_exams ue ON ue.id = a.user_exam_id
			 WHERE a.id = ? AND ue.user_id = ?`,
			[attemptId, userId]
		)
	);
	if (!rows[0]) return null;
	const [result] = /** @type {[Result, unknown]} */ (
		await db.execute(
			`DELETE a FROM exam_attempts a JOIN user_exams ue ON ue.id = a.user_exam_id
			 WHERE a.id = ? AND ue.user_id = ?`,
			[attemptId, userId]
		)
	);
	return result.affectedRows > 0 ? rows[0].user_exam_id : null;
}

/**
 * Imposta (o toglie, con null) il docente di un esame del libretto.
 * @param {number} userId
 * @param {number} userExamId
 * @param {string | null} teacher
 * @returns {Promise<boolean>} false se la riga non esiste o non e' dell'utente
 */
export async function setTeacher(userId, userExamId, teacher) {
	const [result] = /** @type {[Result, unknown]} */ (
		await db.execute('UPDATE user_exams SET teacher = ? WHERE id = ? AND user_id = ?', [
			teacher,
			userExamId,
			userId
		])
	);
	return result.affectedRows > 0;
}

/**
 * Elemento d'importazione gia' validato (vedi `exam-import.js`); `row` parte da 1.
 * @typedef {{
 * 	row: number,
 * 	name: string,
 * 	cfu: number,
 * 	date: string,
 * 	grade: number | null,
 * 	rejected: boolean,
 * 	teacher: string | null,
 * 	notes: string | null,
 * }} ImportEntry
 */

/** @typedef {{ row: number, key: string, params?: Record<string, string | number> }} ImportError */

/**
 * Importa i tentativi in un'unica transazione: catalogo e libretto vengono creati o riusati,
 * i duplicati esatti (stesso esame, data e voto) saltati. Se un tentativo superato
 * entra in conflitto con un altro (gia' salvato o nello stesso elenco) non si scrive nulla.
 * @param {number} userId
 * @param {ImportEntry[]} entries
 * @returns {Promise<
 * 	| { ok: true, attempts: number, newExams: number, duplicates: number }
 * 	| { ok: false, errors: ImportError[] }
 * >}
 */
export async function importAttempts(userId, entries) {
	/** @type {Map<string, ImportEntry[]>} */
	const groups = new Map();
	for (const entry of entries) {
		const key = `${examSearchKey(entry.name)}|${entry.cfu}`;
		const list = groups.get(key);
		if (list) list.push(entry);
		else groups.set(key, [entry]);
	}

	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		let newExams = 0;
		let duplicates = 0;
		/** @type {ImportError[]} */
		const errors = [];
		/** @type {{ userExamId: number, entry: ImportEntry }[]} */
		const inserts = [];
		/** @type {{ userExamId: number, teacher: string }[]} */
		const teachers = [];

		for (const group of groups.values()) {
			const { name, cfu } = group[0];

			// Catalogo: confronto della collation (maiuscole e accenti non contano)
			let [found] = /** @type {[Rows, unknown]} */ (
				await conn.execute('SELECT id FROM exams WHERE name = ? AND cfu = ?', [name, cfu])
			);
			let examId = found[0]?.id;
			if (!examId) {
				try {
					const [result] = /** @type {[Result, unknown]} */ (
						await conn.execute('INSERT INTO exams (name, cfu, created_by) VALUES (?, ?, ?)', [
							name,
							cfu,
							userId
						])
					);
					examId = result.insertId;
					newExams++;
				} catch (err) {
					// Creato nel frattempo da un'altra richiesta
					if (/** @type {{ code?: string }} */ (err).code !== 'ER_DUP_ENTRY') throw err;
					[found] = /** @type {[Rows, unknown]} */ (
						await conn.execute('SELECT id FROM exams WHERE name = ? AND cfu = ?', [name, cfu])
					);
					examId = found[0]?.id;
					if (!examId) throw err;
				}
			}

			// Libretto: la riga viene bloccata come in addAttempt
			await conn.execute(
				`INSERT INTO user_exams (user_id, exam_id) VALUES (?, ?)
				 ON DUPLICATE KEY UPDATE user_id = user_id`,
				[userId, examId]
			);
			const [ueRows] = /** @type {[Rows, unknown]} */ (
				await conn.execute(
					'SELECT id FROM user_exams WHERE user_id = ? AND exam_id = ? FOR UPDATE',
					[userId, examId]
				)
			);
			const userExamId = /** @type {number} */ (ueRows[0].id);

			const [existingRows] = /** @type {[Rows, unknown]} */ (
				await conn.execute(
					`SELECT DATE_FORMAT(attempt_date, '%Y-%m-%d') AS attempt_date, grade, rejected
					 FROM exam_attempts WHERE user_exam_id = ?`,
					[userExamId]
				)
			);
			/** @type {{ date: string, grade: number | null, rejected: boolean, row: number | null }[]} */
			const known = existingRows.map((row) => ({
				date: row.attempt_date,
				grade: row.grade ?? null,
				rejected: !!row.rejected,
				row: null
			}));

			for (const entry of group) {
				if (known.some((a) => a.date === entry.date && a.grade === entry.grade)) {
					duplicates++;
					continue;
				}
				if (isPassing(entry)) {
					const passing = known.find(isPassing);
					if (passing?.row) {
						errors.push({
							row: entry.row,
							key: 'import.errors.passedTwice',
							params: { name: entry.name, other: passing.row }
						});
					} else if (passing) {
						errors.push({
							row: entry.row,
							key: 'import.errors.alreadyPassed',
							params: { name: entry.name }
						});
					}
				}
				known.push({ ...entry, row: entry.row });
				inserts.push({ userExamId, entry });
			}

			const teacher = group.findLast((entry) => entry.teacher)?.teacher;
			if (teacher) teachers.push({ userExamId, teacher });
		}

		if (errors.length > 0) {
			await conn.rollback();
			return { ok: false, errors: errors.sort((a, b) => a.row - b.row) };
		}

		for (const { userExamId, entry } of inserts) {
			await conn.execute(
				`INSERT INTO exam_attempts (user_exam_id, attempt_date, grade, rejected, notes)
				 VALUES (?, ?, ?, ?, ?)`,
				[userExamId, entry.date, entry.grade, entry.rejected, entry.notes]
			);
		}
		for (const { userExamId, teacher } of teachers) {
			await conn.execute('UPDATE user_exams SET teacher = ? WHERE id = ? AND user_id = ?', [
				teacher,
				userExamId,
				userId
			]);
		}

		await conn.commit();
		return { ok: true, attempts: inserts.length, newExams, duplicates };
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
}

/**
 * Prossimo appello del libretto, per la Panoramica.
 * @typedef {{
 * 	userExamId: number,
 * 	name: string,
 * 	cfu: number,
 * 	plannedDate: string,
 * 	daysLeft: number,
 * }} UpcomingExam
 */

/**
 * Esami del libretto dell'utente con appello da oggi in poi e non ancora superati,
 * in ordine di data e poi di nome.
 * @param {number} userId
 * @param {string} today `YYYY-MM-DD`
 * @param {number} limit
 * @returns {Promise<UpcomingExam[]>}
 */
export async function getUpcomingExams(userId, today, limit) {
	// LIMIT con execute(): il valore va passato come stringa (prepared statement di mysql2)
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT ue.id, e.name, e.cfu, DATE_FORMAT(ue.planned_date, '%Y-%m-%d') AS planned_date
			 FROM user_exams ue JOIN exams e ON e.id = ue.exam_id
			 WHERE ue.user_id = ? AND ue.planned_date >= ?
			   AND NOT EXISTS (SELECT 1 FROM exam_attempts a
			                   WHERE a.user_exam_id = ue.id AND a.grade >= ? AND a.rejected = 0)
			 ORDER BY ue.planned_date, e.name, e.cfu
			 LIMIT ?`,
			[userId, today, PASS_MIN, String(Math.max(0, Math.trunc(limit)))]
		)
	);
	const start = isoToUtcDate(today).getTime();
	return rows.map((row) => ({
		userExamId: row.id,
		name: row.name,
		cfu: row.cfu,
		plannedDate: row.planned_date,
		daysLeft: Math.round((isoToUtcDate(row.planned_date).getTime() - start) / DAY_MS)
	}));
}

/**
 * Somma dei CFU degli esami superati dall'utente.
 * @param {number} userId
 * @returns {Promise<number>}
 */
export async function getEarnedCfu(userId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT COALESCE(SUM(e.cfu), 0) AS cfu
			 FROM user_exams ue JOIN exams e ON e.id = ue.exam_id
			 WHERE ue.user_id = ?
			   AND EXISTS (SELECT 1 FROM exam_attempts a
			               WHERE a.user_exam_id = ue.id AND a.grade >= ? AND a.rejected = 0)`,
			[userId, PASS_MIN]
		)
	);
	return Number(rows[0]?.cfu ?? 0);
}
