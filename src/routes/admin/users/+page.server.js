import { requireAdmin } from '#lib/server/auth.js';
import { listUsers } from '#lib/server/admin.js';
import { readListParams } from '#lib/admin-rules.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
	requireAdmin(locals);
	const { q, page } = readListParams(url.searchParams);
	return { q, list: await listUsers(q, page) };
}
