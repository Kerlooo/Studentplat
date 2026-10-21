import { db } from './db.js';
import { ADMIN_PAGE_SIZE } from '#lib/admin-rules.js';
import { PASS_MIN } from '#lib/grade-rules.js';

/*
 * Query del pannello admin: le uniche trasversali agli utenti.
 * Chi le chiama deve aver gia' verificato il ruolo con requireAdmin.
 */

/** @typedef {import('mysql2').RowDataPacket[]} Rows */
/** @typedef {import('mysql2').ResultSetHeader} Result */
/** @typedef {'user' | 'admin'} Role */

/**
 * Pagina di un elenco: la pagina richiesta viene riportata nell'intervallo valido.
 * @template T
 * @typedef {{ items: T[], total: number, page: number, pages: number }} Paged
 */

/** @param {Date | string | null | undefined} value */
const iso = (value) => (value ? new Date(value).toISOString() : null);

/** @param {unknown} value */
const count = (value) => Number(value ?? 0);

/** @param {unknown} value @returns {Role} */
const toRole = (value) => (value === 'admin' ? 'admin' : 'user');

/**
 * Testo cercato come pattern LIKE "contiene", con i caratteri jolly resi letterali.
 * @param {string} q
 */
const likePattern = (q) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

/**
 * @param {number} total
 * @param {number} page
 */
function pageInfo(total, page) {
	const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
	const current = Math.min(Math.max(1, page), pages);
	// LIMIT/OFFSET con execute(): i valori vanno passati come stringhe (prepared statement di mysql2)
	return {
		pages,
		page: current,
		limit: String(ADMIN_PAGE_SIZE),
		offset: String((current - 1) * ADMIN_PAGE_SIZE)
	};
}

/**
 * Statistiche generali del sito.
 * @returns {Promise<{
 * 	users: number,
 * 	newUsers: number,
 * 	admins: number,
 * 	exams: number,
 * 	userExams: number,
 * 	attempts: number,
 * }>}
 */
export async function getSiteStats() {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT (SELECT COUNT(*) FROM users) AS users,
			        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL 30 DAY) AS new_users,
			        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
			        (SELECT COUNT(*) FROM exams) AS exams,
			        (SELECT COUNT(*) FROM user_exams) AS user_exams,
			        (SELECT COUNT(*) FROM exam_attempts) AS attempts`
		)
	);
	const row = rows[0];
	return {
		users: count(row?.users),
		newUsers: count(row?.new_users),
		admins: count(row?.admins),
		exams: count(row?.exams),
		userExams: count(row?.user_exams),
		attempts: count(row?.attempts)
	};
}

/**
 * Riga dell'elenco utenti. Date in ISO 8601.
 * @typedef {{
 * 	id: number,
 * 	email: string,
 * 	name: string,
 * 	nickname: string | null,
 * 	role: Role,
 * 	createdAt: string | null,
 * 	lastLoginAt: string | null,
 * }} AdminUserRow
 */

/**
 * Utenti in ordine di registrazione (piu' recenti prima), con ricerca su email, nome e nickname.
 * @param {string} q
 * @param {number} page
 * @returns {Promise<Paged<AdminUserRow>>}
 */
export async function listUsers(q, page) {
	const where = q ? 'WHERE email LIKE ? OR name LIKE ? OR nickname LIKE ?' : '';
	const params = q ? [likePattern(q), likePattern(q), likePattern(q)] : [];

	const [totalRows] = /** @type {[Rows, unknown]} */ (
		await db.execute(`SELECT COUNT(*) AS total FROM users ${where}`, params)
	);
	const total = count(totalRows[0]?.total);
	const info = pageInfo(total, page);

	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT id, email, name, nickname, role, created_at, last_login_at
			 FROM users ${where}
			 ORDER BY created_at DESC, id DESC
			 LIMIT ? OFFSET ?`,
			[...params, info.limit, info.offset]
		)
	);
	return {
		items: rows.map((row) => ({
			id: row.id,
			email: row.email,
			name: row.name,
			nickname: row.nickname ?? null,
			role: toRole(row.role),
			createdAt: iso(row.created_at),
			lastLoginAt: iso(row.last_login_at)
		})),
		total,
		page: info.page,
		pages: info.pages
	};
}

/**
 * Scheda di un utente per il pannello.
 * @typedef {AdminUserRow & {
 * 	degreeCourse: string | null,
 * 	university: string | null,
 * 	totalCfu: number | null,
 * 	userExams: number,
 * 	attempts: number,
 * 	activeSessions: number,
 * }} AdminUserDetail
 */

/**
 * @param {number} userId
 * @returns {Promise<AdminUserDetail | null>}
 */
export async function getUserDetail(userId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT u.id, u.email, u.name, u.nickname, u.role, u.degree_course, u.university,
			        u.total_cfu, u.created_at, u.last_login_at,
			        (SELECT COUNT(*) FROM user_exams ue WHERE ue.user_id = u.id) AS user_exams,
			        (SELECT COUNT(*) FROM exam_attempts a JOIN user_exams ue ON ue.id = a.user_exam_id
			         WHERE ue.user_id = u.id) AS attempts,
			        (SELECT COUNT(*) FROM sessions s
			         WHERE s.user_id = u.id AND s.expires_at > ?) AS active_sessions
			 FROM users u WHERE u.id = ?`,
			[new Date(), userId]
		)
	);
	const row = rows[0];
	if (!row) return null;
	return {
		id: row.id,
		email: row.email,
		name: row.name,
		nickname: row.nickname ?? null,
		role: toRole(row.role),
		createdAt: iso(row.created_at),
		lastLoginAt: iso(row.last_login_at),
		degreeCourse: row.degree_course ?? null,
		university: row.university ?? null,
		totalCfu: row.total_cfu ?? null,
		userExams: count(row.user_exams),
		attempts: count(row.attempts),
		activeSessions: count(row.active_sessions)
	};
}

/**
 * @param {number} userId
 * @param {Role} role
 * @returns {Promise<boolean>} false se l'utente non esiste
 */
export async function setUserRole(userId, role) {
	const [result] = /** @type {[Result, unknown]} */ (
		await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId])
	);
	// Con FOUND_ROWS (default di mysql2) conta anche le righe gia' con quel ruolo
	return result.affectedRows > 0;
}

/**
 * Chiude tutte le sessioni dell'utente.
 * @param {number} userId
 * @returns {Promise<number | null>} sessioni chiuse, null se l'utente non esiste
 */
export async function logoutUserEverywhere(userId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute('SELECT id FROM users WHERE id = ?', [userId])
	);
	if (!rows[0]) return null;
	const [result] = /** @type {[Result, unknown]} */ (
		await db.execute('DELETE FROM sessions WHERE user_id = ?', [userId])
	);
	return result.affectedRows;
}

/**
 * Cancella l'utente (stessa operazione dell'eliminazione dal profilo):
 * sessioni, libretto e tentativi spariscono per cascata,
 * gli esami che aveva creato restano nel catalogo senza autore.
 */
export { deleteAccount as deleteUser } from './profile.js';

/**
 * Esame del catalogo con chi l'ha creato e quanto e' usato.
 * `creator` e' null se l'utente che l'ha creato e' stato eliminato.
 * @typedef {{
 * 	id: number,
 * 	name: string,
 * 	cfu: number,
 * 	creator: { id: number, email: string } | null,
 * 	createdAt: string | null,
 * 	userExams: number,
 * 	attempts: number,
 * }} AdminExam
 */

const EXAM_COLUMNS = `e.id, e.name, e.cfu, e.created_at, u.id AS creator_id, u.email AS creator_email,
	(SELECT COUNT(*) FROM user_exams ue WHERE ue.exam_id = e.id) AS user_exams,
	(SELECT COUNT(*) FROM exam_attempts a JOIN user_exams ue ON ue.id = a.user_exam_id
	 WHERE ue.exam_id = e.id) AS attempts`;

/**
 * @param {import('mysql2').RowDataPacket} row
 * @returns {AdminExam}
 */
const toAdminExam = (row) => ({
	id: row.id,
	name: row.name,
	cfu: row.cfu,
	creator: row.creator_id ? { id: row.creator_id, email: row.creator_email } : null,
	createdAt: iso(row.created_at),
	userExams: count(row.user_exams),
	attempts: count(row.attempts)
});

/**
 * Catalogo in ordine di nome, con ricerca sul nome (collation: maiuscole e accenti non contano).
 * @param {string} q
 * @param {number} page
 * @returns {Promise<Paged<AdminExam>>}
 */
export async function listCatalog(q, page) {
	const where = q ? 'WHERE e.name LIKE ?' : '';
	const params = q ? [likePattern(q)] : [];

	const [totalRows] = /** @type {[Rows, unknown]} */ (
		await db.execute(`SELECT COUNT(*) AS total FROM exams e ${where}`, params)
	);
	const total = count(totalRows[0]?.total);
	const info = pageInfo(total, page);

	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT ${EXAM_COLUMNS}
			 FROM exams e LEFT JOIN users u ON u.id = e.created_by
			 ${where}
			 ORDER BY e.name, e.cfu
			 LIMIT ? OFFSET ?`,
			[...params, info.limit, info.offset]
		)
	);
	return { items: rows.map(toAdminExam), total, page: info.page, pages: info.pages };
}

/**
 * @param {number} examId
 * @returns {Promise<AdminExam | null>}
 */
export async function getAdminExam(examId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute(
			`SELECT ${EXAM_COLUMNS}
			 FROM exams e LEFT JOIN users u ON u.id = e.created_by
			 WHERE e.id = ?`,
			[examId]
		)
	);
	return rows[0] ? toAdminExam(rows[0]) : null;
}

/**
 * Tutti gli altri esami del catalogo, per scegliere la destinazione di un'unione.
 * @param {number} excludeId
 * @returns {Promise<{ id: number, name: string, cfu: number }[]>}
 */
export async function listOtherExams(excludeId) {
	const [rows] = /** @type {[Rows, unknown]} */ (
		await db.execute('SELECT id, name, cfu FROM exams WHERE id <> ? ORDER BY name, cfu', [
			excludeId
		])
	);
	return rows.map((row) => ({ id: row.id, name: row.name, cfu: row.cfu }));
}

/**
 * Modifica nome e CFU. Un altro esame con la stessa coppia (confronto della collation)
 * blocca la modifica: in quel caso va unito, non rinominato.
 * @param {number} examId
 * @param {string} name gia' normalizzato
 * @param {number} cfu
 * @returns {Promise<
 * 	| { status: 'notFound' }
 * 	| { status: 'duplicate', duplicate: { id: number, name: string, cfu: number } }
 * 	| { status: 'updated' }
 * >}
 */
export async function updateExam(examId, name, cfu) {
	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		const [rows] = /** @type {[Rows, unknown]} */ (
			await conn.execute('SELECT id FROM exams WHERE id = ? FOR UPDATE', [examId])
		);
		if (!rows[0]) {
			await conn.rollback();
			return { status: 'notFound' };
		}

		const findDuplicate = async () => {
			const [dup] = /** @type {[Rows, unknown]} */ (
				await conn.execute(
					// Lettura con lock: vede anche le righe appena create da altre transazioni
					'SELECT id, name, cfu FROM exams WHERE name = ? AND cfu = ? AND id <> ? LOCK IN SHARE MODE',
					[name, cfu, examId]
				)
			);
			return dup[0] ? { id: dup[0].id, name: dup[0].name, cfu: dup[0].cfu } : null;
		};

		let duplicate = await findDuplicate();
		if (!duplicate) {
			try {
				await conn.execute('UPDATE exams SET name = ?, cfu = ? WHERE id = ?', [name, cfu, examId]);
			} catch (err) {
				// Creato nel frattempo da un'altra richiesta
				if (/** @type {{ code?: string }} */ (err).code !== 'ER_DUP_ENTRY') throw err;
				duplicate = await findDuplicate();
				if (!duplicate) throw err;
			}
		}
		if (duplicate) {
			await conn.rollback();
			return { status: 'duplicate', duplicate };
		}

		await conn.commit();
		return { status: 'updated' };
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
}

/**
 * Cancella l'esame e tutte le voci di libretto che lo usano (i tentativi spariscono per cascata).
 * L'esame resta bloccato per tutta la transazione: nessuno puo' aggiungerlo al libretto nel frattempo.
 * @param {number} examId
 * @returns {Promise<{ status: 'notFound' } | { status: 'deleted', userExams: number, attempts: number }>}
 */
export async function deleteExam(examId) {
	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		const [rows] = /** @type {[Rows, unknown]} */ (
			await conn.execute('SELECT id FROM exams WHERE id = ? FOR UPDATE', [examId])
		);
		if (!rows[0]) {
			await conn.rollback();
			return { status: 'notFound' };
		}

		const [counts] = /** @type {[Rows, unknown]} */ (
			await conn.execute(
				`SELECT COUNT(DISTINCT ue.id) AS user_exams, COUNT(a.id) AS attempts
				 FROM user_exams ue LEFT JOIN exam_attempts a ON a.user_exam_id = ue.id
				 WHERE ue.exam_id = ?`,
				[examId]
			)
		);
		await conn.execute('DELETE FROM user_exams WHERE exam_id = ?', [examId]);
		await conn.execute('DELETE FROM exams WHERE id = ?', [examId]);
		await conn.commit();
		return {
			status: 'deleted',
			userExams: count(counts[0]?.user_exams),
			attempts: count(counts[0]?.attempts)
		};
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
}

/**
 * Unisce l'esame `sourceId` in `targetId` e poi cancella la sorgente.
 * - Utente con solo la sorgente: la sua voce passa alla destinazione.
 * - Utente con entrambi: i tentativi passano alla voce di destinazione, che tiene appello e
 *   docente (se mancano prende quelli della sorgente); la voce sorgente viene cancellata.
 * - Utente con un superamento in entrambi: unione bloccata, nessuna modifica.
 * Esami e voci di libretto restano bloccati per tutta la transazione.
 * @param {number} sourceId
 * @param {number} targetId diverso da sourceId
 * @returns {Promise<
 * 	| { status: 'notFound' }
 * 	| { status: 'targetNotFound' }
 * 	| { status: 'conflict', emails: string[] }
 * 	| { status: 'merged', moved: number, combined: number }
 * >}
 */
export async function mergeExams(sourceId, targetId) {
	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		// Blocchi sempre in ordine di id, per non incrociarsi con un'unione inversa
		const [exams] = /** @type {[Rows, unknown]} */ (
			await conn.execute('SELECT id FROM exams WHERE id IN (?, ?) ORDER BY id FOR UPDATE', [
				sourceId,
				targetId
			])
		);
		const found = new Set(exams.map((row) => row.id));
		if (!found.has(sourceId) || !found.has(targetId)) {
			await conn.rollback();
			return { status: found.has(sourceId) ? 'targetNotFound' : 'notFound' };
		}

		const [entries] = /** @type {[Rows, unknown]} */ (
			await conn.execute(
				`SELECT id, user_id, exam_id, DATE_FORMAT(planned_date, '%Y-%m-%d') AS planned_date, teacher,
				        difficulty
				 FROM user_exams WHERE exam_id IN (?, ?) ORDER BY id FOR UPDATE`,
				[sourceId, targetId]
			)
		);

		/** @type {Set<number>} */
		const passed = new Set();
		if (entries.length > 0) {
			const ids = entries.map((row) => row.id);
			const [passing] = /** @type {[Rows, unknown]} */ (
				await conn.query(
					`SELECT DISTINCT user_exam_id FROM exam_attempts
					 WHERE user_exam_id IN (?) AND grade >= ? AND rejected = 0`,
					[ids, PASS_MIN]
				)
			);
			for (const row of passing) passed.add(row.user_exam_id);
		}

		/** @typedef {import('mysql2').RowDataPacket} Entry */
		/** @type {Map<number, { source?: Entry, target?: Entry }>} */
		const byUser = new Map();
		for (const row of entries) {
			const pair = byUser.get(row.user_id) ?? {};
			if (row.exam_id === sourceId) pair.source = row;
			else pair.target = row;
			byUser.set(row.user_id, pair);
		}

		/** @type {{ userId: number, source: Entry, target: Entry }[]} */
		const both = [];
		for (const [userId, { source, target }] of byUser) {
			if (source && target) both.push({ userId, source, target });
		}
		const conflicts = both
			.filter(({ source, target }) => passed.has(source.id) && passed.has(target.id))
			.map(({ userId }) => userId);
		if (conflicts.length > 0) {
			const [users] = /** @type {[Rows, unknown]} */ (
				await conn.query('SELECT email FROM users WHERE id IN (?) ORDER BY email', [conflicts])
			);
			await conn.rollback();
			return { status: 'conflict', emails: users.map((row) => row.email) };
		}

		for (const { source, target } of both) {
			await conn.execute('UPDATE exam_attempts SET user_exam_id = ? WHERE user_exam_id = ?', [
				target.id,
				source.id
			]);
			await conn.execute(
				`UPDATE user_exams SET planned_date = COALESCE(planned_date, ?),
				        teacher = COALESCE(teacher, ?), difficulty = COALESCE(difficulty, ?)
				 WHERE id = ?`,
				[source.planned_date ?? null, source.teacher ?? null, source.difficulty ?? null, target.id]
			);
			await conn.execute('DELETE FROM user_exams WHERE id = ?', [source.id]);
		}

		// Restano solo gli utenti con la sola sorgente: la voce passa alla destinazione
		const [moved] = /** @type {[Result, unknown]} */ (
			await conn.execute('UPDATE user_exams SET exam_id = ? WHERE exam_id = ?', [
				targetId,
				sourceId
			])
		);
		await conn.execute('DELETE FROM exams WHERE id = ?', [sourceId]);
		await conn.commit();
		return { status: 'merged', moved: moved.affectedRows, combined: both.length };
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
}
