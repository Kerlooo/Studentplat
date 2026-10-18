import { requireUser } from '#lib/server/auth.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	requireUser(locals);
}
