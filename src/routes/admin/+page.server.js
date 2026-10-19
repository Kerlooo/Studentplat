import { requireAdmin } from '#lib/server/auth.js';
import { getSiteStats } from '#lib/server/admin.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	requireAdmin(locals);
	return { stats: await getSiteStats() };
}
