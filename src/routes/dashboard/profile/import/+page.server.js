import { fail } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.js';
import { importAttempts } from '#lib/server/exams.js';
import { parseImport } from '#lib/server/exam-import.js';
import { today } from '#lib/server/form.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	requireUser(locals);
	return {};
}

/** @type {import('./$types').Actions} */
export const actions = {
	default: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const raw = data.get('json');
		const importText = typeof raw === 'string' ? raw : '';

		// Tutto viene validato prima di scrivere: con un solo errore non si salva nulla
		const parsed = parseImport(importText, today());
		if (!parsed.ok) return fail(400, { importText, importErrors: parsed.errors });

		try {
			const result = await importAttempts(user.id, parsed.entries);
			if (!result.ok) return fail(409, { importText, importErrors: result.errors });
			return {
				imported: {
					attempts: result.attempts,
					newExams: result.newExams,
					duplicates: result.duplicates
				}
			};
		} catch (err) {
			console.error(err);
			return fail(500, { importText, importErrors: [{ row: 0, key: 'import.errors.generic' }] });
		}
	}
};
