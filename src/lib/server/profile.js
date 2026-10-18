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
