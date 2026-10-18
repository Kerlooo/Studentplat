import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, deleteSessionCookie, invalidateSession } from '#lib/server/auth.js';

/** @type {import('./$types').PageServerLoad} */
export function load({ locals }) {
	if (!locals.user) redirect(303, '/');
	return { user: locals.user };
}

/** @type {import('./$types').Actions} */
export const actions = {
	logout: async ({ cookies, locals }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) await invalidateSession(token);
		deleteSessionCookie(cookies);
		locals.user = null;
		redirect(303, '/');
	}
};
