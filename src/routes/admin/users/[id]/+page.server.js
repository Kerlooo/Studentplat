import { error, fail, redirect } from '@sveltejs/kit';
import { deleteSessionCookie, requireAdmin } from '#lib/server/auth.js';
import { deleteUser, getUserDetail, logoutUserEverywhere, setUserRole } from '#lib/server/admin.js';
import { parseId, str } from '#lib/server/form.js';

const NOT_FOUND = 'admin.errors.userNotFound';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params }) {
	const admin = requireAdmin(locals);
	const userId = parseId(params.id);
	const user = userId === null ? null : await getUserDetail(userId);
	if (!user) error(404);
	return { user, isSelf: user.id === admin.id };
}

/** @type {import('./$types').Actions} */
export const actions = {
	role: async ({ request, locals, params }) => {
		const admin = requireAdmin(locals);
		const userId = parseId(params.id);
		if (userId === null) return fail(404, { error: NOT_FOUND });
		if (userId === admin.id) return fail(400, { error: 'admin.errors.selfRole' });

		const role = str((await request.formData()).get('role'));
		if (role !== 'user' && role !== 'admin')
			return fail(400, { error: 'admin.errors.roleInvalid' });

		try {
			if (!(await setUserRole(userId, role))) return fail(404, { error: NOT_FOUND });
			return { action: 'role', role };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'admin.errors.generic' });
		}
	},

	logoutAll: async ({ locals, params, cookies }) => {
		const admin = requireAdmin(locals);
		const userId = parseId(params.id);
		if (userId === null) return fail(404, { error: NOT_FOUND });

		/** @type {number | null} */
		let closed;
		try {
			closed = await logoutUserEverywhere(userId);
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'admin.errors.generic' });
		}
		if (closed === null) return fail(404, { error: NOT_FOUND });

		// Su se stessi: anche la sessione corrente e' chiusa, si torna all'accesso
		if (userId === admin.id) {
			deleteSessionCookie(cookies);
			locals.user = null;
			redirect(303, '/login');
		}
		return { action: 'logoutAll', closed };
	},

	delete: async ({ request, locals, params }) => {
		const admin = requireAdmin(locals);
		const userId = parseId(params.id);
		if (userId === null) return fail(404, { error: NOT_FOUND });
		if (userId === admin.id) return fail(400, { error: 'admin.errors.selfDelete' });

		// Senza JavaScript il primo invio arriva senza conferma: si chiede di confermare
		const data = await request.formData();
		if (data.get('confirm') !== '1') return { action: 'confirmDelete' };

		/** @type {boolean} */
		let deleted;
		try {
			deleted = await deleteUser(userId);
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'admin.errors.generic' });
		}
		if (!deleted) return fail(404, { error: NOT_FOUND });
		redirect(303, '/admin/users');
	}
};
