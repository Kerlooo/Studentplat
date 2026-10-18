/** @type {import('./$types').LayoutServerLoad} */
export function load({ locals }) {
	return { lang: locals.lang, user: locals.user };
}
