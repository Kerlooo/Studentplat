import { error, fail } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.js';
import { getProfile, updateProfile } from '#lib/server/profile.js';
import { NAME_MAX } from '#lib/auth-rules.js';
import {
	DEGREE_COURSE_MAX,
	NICKNAME_MAX,
	TOTAL_CFU_MAX,
	TOTAL_CFU_MIN,
	UNIVERSITY_MAX
} from '#lib/profile-rules.js';

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
	}
};
