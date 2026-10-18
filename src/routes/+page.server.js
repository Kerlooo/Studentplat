import { fail, redirect } from '@sveltejs/kit';
import { db } from '#lib/server/db.js';
import { createSession, hashPassword, setSessionCookie, verifyPassword } from '#lib/server/auth.js';
import { EMAIL_MAX, NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from '#lib/auth-rules.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hash fittizio: se l'email non esiste si verifica comunque una password,
// così i tempi di risposta non rivelano quali email sono registrate.
const dummyHash = hashPassword('dummy-password-for-timing');

/** @param {FormDataEntryValue | null} value */
const str = (value) => (typeof value === 'string' ? value : '');

/** @type {import('./$types').PageServerLoad} */
export function load({ locals }) {
	if (locals.user) redirect(303, '/dashboard');
}

/** @type {import('./$types').Actions} */
export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = str(data.get('email')).trim().toLowerCase();
		const password = str(data.get('password'));
		const values = { email };

		const invalid = () =>
			fail(400, {
				form: /** @type {const} */ ('login'),
				values,
				errors: { general: 'auth.errors.invalidCredentials' }
			});

		if (!email || !password || password.length > PASSWORD_MAX) return invalid();

		const [rows] = /** @type {[import('mysql2').RowDataPacket[], unknown]} */ (
			await db.execute('SELECT id, password_hash FROM users WHERE email = ?', [email])
		);
		const user = rows[0];
		const ok = await verifyPassword(password, user ? user.password_hash : await dummyHash);
		if (!user || !ok) return invalid();

		const { token, expiresAt } = await createSession(user.id);
		setSessionCookie(cookies, token, expiresAt);
		redirect(303, '/dashboard');
	},

	register: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = str(data.get('name')).trim();
		const email = str(data.get('email')).trim().toLowerCase();
		const password = str(data.get('password'));
		const passwordConfirm = str(data.get('passwordConfirm'));
		const values = { name, email };

		/** @type {Record<string, string>} */
		const errors = {};
		if (!name) errors.name = 'auth.errors.nameRequired';
		else if (name.length > NAME_MAX) errors.name = 'auth.errors.nameTooLong';

		if (!EMAIL_RE.test(email) || email.length > EMAIL_MAX)
			errors.email = 'auth.errors.emailInvalid';

		if (password.length < PASSWORD_MIN) errors.password = 'auth.errors.passwordTooShort';
		else if (password.length > PASSWORD_MAX) errors.password = 'auth.errors.passwordTooLong';
		else if (password !== passwordConfirm) errors.passwordConfirm = 'auth.errors.passwordMismatch';

		if (Object.keys(errors).length > 0) {
			return fail(400, { form: /** @type {const} */ ('register'), values, errors });
		}

		let userId;
		try {
			const [result] = /** @type {[import('mysql2').ResultSetHeader, unknown]} */ (
				await db.execute('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)', [
					email,
					name,
					await hashPassword(password)
				])
			);
			userId = result.insertId;
		} catch (error) {
			if (/** @type {{ code?: string }} */ (error).code === 'ER_DUP_ENTRY') {
				return fail(409, {
					form: /** @type {const} */ ('register'),
					values,
					errors: { email: 'auth.errors.emailTaken' }
				});
			}
			console.error(error);
			return fail(500, {
				form: /** @type {const} */ ('register'),
				values,
				errors: { general: 'auth.errors.generic' }
			});
		}

		const { token, expiresAt } = await createSession(userId);
		setSessionCookie(cookies, token, expiresAt);
		redirect(303, '/dashboard');
	}
};
