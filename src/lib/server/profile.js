import { db } from './db.js';

/**
 * @typedef {{
 * 	name: string,
 * 	nickname: string | null,
 * 	degreeCourse: string | null,
 * 	university: string | null,
 * 	totalCfu: number | null,
 * }} Profile
 */

/**
 * Profilo dell'utente indicato (sempre e solo il suo).
 * @param {number} userId
 * @returns {Promise<Profile | null>}
 */
export async function getProfile(userId) {
	const [rows] = /** @type {[import('mysql2').RowDataPacket[], unknown]} */ (
		await db.execute(
			'SELECT name, nickname, degree_course, university, total_cfu FROM users WHERE id = ?',
			[userId]
		)
	);
	const row = rows[0];
	if (!row) return null;
	return {
		name: row.name,
		nickname: row.nickname,
		degreeCourse: row.degree_course,
		university: row.university,
		totalCfu: row.total_cfu
	};
}

/**
 * @param {number} userId
 * @param {Profile} profile
 */
export async function updateProfile(userId, profile) {
	await db.execute(
		`UPDATE users
		 SET name = ?, nickname = ?, degree_course = ?, university = ?, total_cfu = ?
		 WHERE id = ?`,
		[
			profile.name,
			profile.nickname,
			profile.degreeCourse,
			profile.university,
			profile.totalCfu,
			userId
		]
	);
}

/**
 * Hash della password dell'utente, per riconfermarne l'identita' (null se non esiste).
 * @param {number} userId
 * @returns {Promise<string | null>}
 */
export async function getPasswordHash(userId) {
	const [rows] = /** @type {[import('mysql2').RowDataPacket[], unknown]} */ (
		await db.execute('SELECT password_hash FROM users WHERE id = ?', [userId])
	);
	return rows[0]?.password_hash ?? null;
}

/**
 * Elimina l'account: sessioni, libretto e tentativi spariscono per cascata,
 * gli esami che l'utente aveva creato restano nel catalogo senza autore.
 * Usata sia dal profilo (eliminazione del proprio account) sia dal pannello admin.
 * @param {number} userId
 * @returns {Promise<boolean>} false se l'utente non esiste
 */
export async function deleteAccount(userId) {
	const conn = await db.getConnection();
	try {
		await conn.beginTransaction();
		// Stesso ordine di lock di cancellazione e unione esami: prima exams, poi la cascata su user_exams
		await conn.execute('SELECT id FROM exams WHERE created_by = ? ORDER BY id FOR UPDATE', [
			userId
		]);
		const [result] = /** @type {[import('mysql2').ResultSetHeader, unknown]} */ (
			await conn.execute('DELETE FROM users WHERE id = ?', [userId])
		);
		await conn.commit();
		return result.affectedRows > 0;
	} catch (err) {
		await conn.rollback();
		throw err;
	} finally {
		conn.release();
	}
}
