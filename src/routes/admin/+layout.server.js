import { requireAdmin } from '#lib/server/auth.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	requireAdmin(locals);
}
