import { error, fail, redirect } from '@sveltejs/kit';
import { requireAdmin } from '#lib/server/auth.js';
import {
	deleteExam,
	getAdminExam,
	listOtherExams,
	mergeExams,
	updateExam
} from '#lib/server/admin.js';
import { parseId, str } from '#lib/server/form.js';
import { EXAM_CFU_MAX, EXAM_CFU_MIN, EXAM_NAME_MAX, normalizeExamName } from '#lib/exam-rules.js';

const NOT_FOUND = 'admin.errors.examNotFound';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, params }) {
	requireAdmin(locals);
	const examId = parseId(params.id);
	const exam = examId === null ? null : await getAdminExam(examId);
	if (!exam) error(404);
	return { exam, others: await listOtherExams(exam.id) };
}

/** @type {import('./$types').Actions} */
export const actions = {
	edit: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const examId = parseId(params.id);
		if (examId === null) return fail(404, { error: NOT_FOUND });

		const data = await request.formData();
		const values = { name: normalizeExamName(str(data.get('name'))), cfu: str(data.get('cfu')) };

		/** @type {Record<string, string>} */
		const errors = {};
		if (!values.name) errors.name = 'admin.errors.nameRequired';
		else if (values.name.length > EXAM_NAME_MAX) errors.name = 'admin.errors.nameTooLong';

		const cfu = /^\d{1,2}$/.test(values.cfu) ? Number(values.cfu) : NaN;
		if (!Number.isInteger(cfu) || cfu < EXAM_CFU_MIN || cfu > EXAM_CFU_MAX)
			errors.cfu = 'admin.errors.cfuInvalid';

		if (Object.keys(errors).length > 0) return fail(400, { values, errors });

		try {
			const result = await updateExam(examId, values.name, cfu);
			if (result.status === 'notFound') return fail(404, { error: NOT_FOUND });
			if (result.status === 'duplicate')
				return fail(409, {
					values,
					errors: { name: 'admin.errors.duplicate' },
					duplicate: result.duplicate
				});
			return { action: 'edit' };
		} catch (err) {
			console.error(err);
			return fail(500, { values, error: 'admin.errors.generic' });
		}
	},

	delete: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const examId = parseId(params.id);
		if (examId === null) return fail(404, { error: NOT_FOUND });

		// Senza JavaScript il primo invio arriva senza conferma: si chiede di confermare
		const data = await request.formData();
		if (data.get('confirm') !== '1') return { action: 'confirmDelete' };

		/** @type {Awaited<ReturnType<typeof deleteExam>>} */
		let result;
		try {
			result = await deleteExam(examId);
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'admin.errors.generic' });
		}
		if (result.status === 'notFound') return fail(404, { error: NOT_FOUND });
		redirect(303, '/admin/exams');
	},

	merge: async ({ request, locals, params }) => {
		requireAdmin(locals);
		const examId = parseId(params.id);
		if (examId === null) return fail(404, { error: NOT_FOUND });

		const data = await request.formData();
		const targetId = parseId(data.get('targetId'));
		if (targetId === null) return fail(400, { error: 'admin.errors.targetRequired' });
		if (targetId === examId) return fail(400, { error: 'admin.errors.mergeSame' });

		if (data.get('confirm') !== '1') return { action: 'confirmMerge', targetId };

		/** @type {Awaited<ReturnType<typeof mergeExams>>} */
		let result;
		try {
			result = await mergeExams(examId, targetId);
		} catch (err) {
			console.error(err);
			return fail(500, { targetId, error: 'admin.errors.generic' });
		}
		if (result.status === 'notFound') return fail(404, { error: NOT_FOUND });
		if (result.status === 'targetNotFound')
			return fail(404, { error: 'admin.errors.targetNotFound' });
		if (result.status === 'conflict')
			return fail(409, { targetId, error: 'admin.errors.mergeConflict', emails: result.emails });
		redirect(303, `/admin/exams/${targetId}`);
	}
};
