import { error, fail, redirect } from '@sveltejs/kit';
import { deleteSessionCookie, requireUser, verifyPassword } from '#lib/server/auth.js';
import { deleteAccount, getPasswordHash, getProfile, updateProfile } from '#lib/server/profile.js';
import { createRateLimiter } from '#lib/server/rate-limit.js';
import { NAME_MAX, PASSWORD_MAX } from '#lib/auth-rules.js';
import {
	DEGREE_COURSE_MAX,
	NICKNAME_MAX,
	TOTAL_CFU_MAX,
	TOTAL_CFU_MIN,
	UNIVERSITY_MAX
} from '#lib/profile-rules.js';

// Riconferma della password prima di eliminare l'account: si contano solo i fallimenti
const deleteByUser = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

/**
 * Errore dell'eliminazione account; la conferma resta aperta (anche senza JavaScript).
 * Chiavi separate da `values`/`errors` del form del profilo.
 * @param {number} status
 * @param {{ password?: string, general?: string }} deleteErrors
 */
const deleteFail = (status, deleteErrors) =>
	fail(status, { action: /** @type {const} */ ('confirmDelete'), deleteErrors });

/** @param {FormDataEntryValue | null} value */
const str = (value) => (typeof value === 'string' ? value.trim() : '');

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const user = requireUser(locals);
	const profile = await getProfile(user.id);
	if (!profile) error(404);
	return { profile };
}

/** @type {import('./$types').Actions} */
export const actions = {
	save: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();

		// Valori grezzi (stringhe) da rimandare al form in caso di errore
		const values = {
			name: str(data.get('name')),
			nickname: str(data.get('nickname')),
			degreeCourse: str(data.get('degreeCourse')),
			university: str(data.get('university')),
			totalCfu: str(data.get('totalCfu'))
		};

		/** @type {Record<string, string>} */
		const errors = {};
		if (!values.name) errors.name = 'auth.errors.nameRequired';
		else if (values.name.length > NAME_MAX) errors.name = 'auth.errors.nameTooLong';

		if (values.nickname.length > NICKNAME_MAX) errors.nickname = 'profile.errors.nicknameTooLong';
		if (values.degreeCourse.length > DEGREE_COURSE_MAX)
			errors.degreeCourse = 'profile.errors.degreeCourseTooLong';
		if (values.university.length > UNIVERSITY_MAX)
			errors.university = 'profile.errors.universityTooLong';

		/** @type {number | null} */
		let totalCfu = null;
		if (values.totalCfu) {
			totalCfu = /^\d+$/.test(values.totalCfu) ? Number(values.totalCfu) : NaN;
			if (!Number.isInteger(totalCfu) || totalCfu < TOTAL_CFU_MIN || totalCfu > TOTAL_CFU_MAX)
				errors.totalCfu = 'profile.errors.totalCfuInvalid';
		}

		if (Object.keys(errors).length > 0) return fail(400, { values, errors });

		try {
			await updateProfile(user.id, {
				name: values.name,
				nickname: values.nickname || null,
				degreeCourse: values.degreeCourse || null,
				university: values.university || null,
				totalCfu
			});
		} catch (err) {
			console.error(err);
			return fail(500, { values, errors: { general: 'auth.errors.generic' } });
		}

		return { saved: true };
	},

	deleteAccount: async ({ request, locals, cookies }) => {
		const user = requireUser(locals);
		// Come nel pannello: un admin non elimina se stesso, deve farlo un altro admin
		if (user.role === 'admin')
			return fail(400, { deleteErrors: { general: 'profile.delete.errors.admin' } });

		const data = await request.formData();
		// Senza JavaScript il primo invio arriva senza conferma: si chiede di confermare
		if (data.get('confirm') !== '1') return { action: /** @type {const} */ ('confirmDelete') };

		const password = typeof data.get('password') === 'string' ? String(data.get('password')) : '';
		if (!password) return deleteFail(400, { password: 'profile.delete.errors.passwordRequired' });

		const key = String(user.id);
		// Controllo prima di scrypt, per non sprecare CPU sui tentativi bloccati
		if (deleteByUser.isLimited(key))
			return deleteFail(429, { general: 'auth.errors.tooManyAttempts' });

		try {
			const hash = await getPasswordHash(user.id);
			const ok =
				hash !== null && password.length <= PASSWORD_MAX && (await verifyPassword(password, hash));
			if (!ok) {
				deleteByUser.hit(key);
				return deleteFail(400, { password: 'profile.delete.errors.passwordWrong' });
			}
			deleteByUser.reset(key);
			// false = account gia' eliminato (es. da un admin): l'esito per l'utente e' lo stesso
			await deleteAccount(user.id);
		} catch (err) {
			console.error(err);
			return deleteFail(500, { general: 'auth.errors.generic' });
		}

		deleteSessionCookie(cookies);
		locals.user = null;
		redirect(303, '/?accountDeleted=1');
	}
};
