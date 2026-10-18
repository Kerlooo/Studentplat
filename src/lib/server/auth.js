import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/env';
import { db } from './db.js';

const scryptAsync =
	/** @type {(password: string, salt: Buffer, keylen: number) => Promise<Buffer>} */ (
		promisify(scrypt)
	);

const KEY_LENGTH = 64;
const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_DURATION_MS = 30 * DAY_MS;
const SESSION_RENEW_THRESHOLD_MS = 15 * DAY_MS;

export const SESSION_COOKIE = 'session';

/**
 * Calcola l'hash della password nel formato `scrypt$salt$hash` (base64url).
 * @param {string} password
 */
export async function hashPassword(password) {
	const salt = randomBytes(16);
	const hash = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH);
	return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

/**
 * @param {string} password
 * @param {string} stored
 */
export async function verifyPassword(password, stored) {
	const [algo, saltB64, hashB64] = stored.split('$');
	if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
	const expected = Buffer.from(hashB64, 'base64url');
	const actual = await scryptAsync(
		password.normalize('NFKC'),
		Buffer.from(saltB64, 'base64url'),
		expected.length
	);
	return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** @param {string} token */
function hashToken(token) {
	return createHash('sha256').update(token).digest('hex');
}

/**
 * Crea una sessione per l'utente e restituisce il token in chiaro da mettere nel cookie.
 * @param {number} userId
 */
export async function createSession(userId) {
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	await db.execute('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [
		hashToken(token),
		userId,
		expiresAt
	]);
	return { token, expiresAt };
}

/**
 * Verifica il token; rinnova la scadenza se mancano meno di 15 giorni.
 * @param {string} token
 * @returns {Promise<{ user: App.User, expiresAt: Date, renewed: boolean } | null>}
 */
export async function validateSession(token) {
	const id = hashToken(token);
	const [rows] = /** @type {[import('mysql2').RowDataPacket[], unknown]} */ (
		await db.execute(
			`SELECT s.expires_at, u.id, u.email, u.name, u.nickname
			 FROM sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.id = ?`,
			[id]
		)
	);
	const row = rows[0];
	if (!row) return null;

	let expiresAt = new Date(row.expires_at);
	if (expiresAt.getTime() <= Date.now()) {
		await db.execute('DELETE FROM sessions WHERE id = ?', [id]);
		return null;
	}

	let renewed = false;
	if (expiresAt.getTime() - Date.now() < SESSION_RENEW_THRESHOLD_MS) {
		expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await db.execute('UPDATE sessions SET expires_at = ? WHERE id = ?', [expiresAt, id]);
		renewed = true;
	}

	return {
		user: { id: row.id, email: row.email, name: row.name, nickname: row.nickname ?? null },
		expiresAt,
		renewed
	};
}

/** @param {string} token */
export async function invalidateSession(token) {
	await db.execute('DELETE FROM sessions WHERE id = ?', [hashToken(token)]);
}

/**
 * @param {import('@sveltejs/kit').Cookies} cookies
 * @param {string} token
 * @param {Date} expiresAt
 */
export function setSessionCookie(cookies, token, expiresAt) {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		expires: expiresAt
	});
}

/**
 * Garantisce che la richiesta sia autenticata, altrimenti rimanda alla homepage.
 * Va chiamata in ogni load e action dell'area riservata: il guard nel layout
 * non protegge le action né le load delle pagine (eseguite in parallelo).
 * @param {App.Locals} locals
 * @returns {App.User}
 */
export function requireUser(locals) {
	if (!locals.user) redirect(303, '/');
	return locals.user;
}

/** @param {import('@sveltejs/kit').Cookies} cookies */
export function deleteSessionCookie(cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
