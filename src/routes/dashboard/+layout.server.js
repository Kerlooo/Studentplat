import { requireUser } from '#lib/server/auth.js';

/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	const user = requireUser(locals);
	// Il ruolo serve solo a mostrare la voce del pannello admin, protetto a parte da requireAdmin
	return { role: user.role };
}
