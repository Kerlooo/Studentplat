import { db } from './db.js';

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
 * }} CatalogExam
 */

/**
 * Catalogo condiviso con, per ogni esame, il libretto dell'utente indicato.
 * `plannedDate` e' gia' una stringa `YYYY-MM-DD` (niente conversioni di fuso).
 * @param {number} userId
 * @returns {Promise<CatalogExam[]>}
 */
export async function getCatalogForUser(userId) {
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
		plannedDate: row.planned_date ?? null
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
 * @returns {Promise<{ status: 'added' | 'moved' | 'unchanged', previousDate: string | null }>}
 */
export async function scheduleExam(userId, examId, date) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT DATE_FORMAT(planned_date, '%Y-%m-%d') AS planned_date
			 FROM user_exams WHERE user_id = ? AND exam_id = ?`,
			[userId, examId]
		)
	);
	const existing = rows[0];

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
