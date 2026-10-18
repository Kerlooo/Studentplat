import { requireUser } from '#lib/server/auth.js';
import { getProfile } from '#lib/server/profile.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const user = requireUser(locals);
	const profile = await getProfile(user.id);
	return {
		greetingName: user.nickname || user.name,
		degreeCourse: profile?.degreeCourse ?? null,
		university: profile?.university ?? null
	};
}
