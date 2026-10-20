import { fail } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.js';
import { importAttempts, importPlannedExams } from '#lib/server/exams.js';
import { parseImport, parsePlannedImport } from '#lib/server/exam-import.js';
import { today } from '#lib/server/form.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	requireUser(locals);
	return {};
}

/**
 * Testo JSON inviato dal campo `json`.
 * @param {Request} request
 */
async function readImportText(request) {
	const raw = (await request.formData()).get('json');
	return typeof raw === 'string' ? raw : '';
}

const genericError = [{ row: 0, key: 'import.errors.generic' }];

/** @type {import('./$types').Actions} */
export const actions = {
	// Esami sostenuti: tentativi con voto
	passed: async ({ request, locals }) => {
		const user = requireUser(locals);
		const importText = await readImportText(request);
		const form = /** @type {const} */ ('passed');

		// Tutto viene validato prima di scrivere: con un solo errore non si salva nulla
		const parsed = parseImport(importText, today());
		if (!parsed.ok) return fail(400, { form, importText, importErrors: parsed.errors });

		try {
			const result = await importAttempts(user.id, parsed.entries);
			if (!result.ok) return fail(409, { form, importText, importErrors: result.errors });
			return {
				form,
				imported: {
					attempts: result.attempts,
					newExams: result.newExams,
					duplicates: result.duplicates
				}
			};
		} catch (err) {
			console.error(err);
			return fail(500, { form, importText, importErrors: genericError });
		}
	},

	// Esami da sostenere: aggiunti al libretto, con appello previsto facoltativo
	planned: async ({ request, locals }) => {
		const user = requireUser(locals);
		const importText = await readImportText(request);
		const form = /** @type {const} */ ('planned');

		const parsed = parsePlannedImport(importText);
		if (!parsed.ok) return fail(400, { form, importText, importErrors: parsed.errors });

		try {
			const imported = await importPlannedExams(user.id, parsed.entries);
			return { form, imported };
		} catch (err) {
			console.error(err);
			return fail(500, { form, importText, importErrors: genericError });
		}
	}
};
