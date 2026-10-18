import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.js';
import {
	createExam,
	getCatalogForUser,
	getExam,
	scheduleExam,
	unscheduleExam
} from '#lib/server/exams.js';
import { formatDate, formatMonth, isIsoDate, parseMonth } from '#lib/calendar.js';
import { EXAM_CFU_MAX, EXAM_CFU_MIN, EXAM_NAME_MAX, normalizeExamName } from '#lib/exam-rules.js';

/** @param {FormDataEntryValue | null} value */
const str = (value) => (typeof value === 'string' ? value.trim() : '');

/**
 * Id numerico positivo, altrimenti null.
 * @param {FormDataEntryValue | null} value
 */
function parseId(value) {
	const text = str(value);
	if (!/^\d{1,10}$/.test(text)) return null;
	const id = Number(text);
	return id > 0 && id <= 4294967295 ? id : null;
}

/** Data di oggi secondo l'orologio del server. */
function today() {
	const now = new Date();
	return formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
	const user = requireUser(locals);
	const todayIso = today();

	const param = url.searchParams.get('month');
	const month = param === null ? parseMonth(todayIso.slice(0, 7)) : parseMonth(param);
	// Mese non valido: si torna al mese corrente invece di mostrare un errore
	if (!month) redirect(303, url.pathname);

	return {
		month: formatMonth(month),
		today: todayIso,
		catalog: await getCatalogForUser(user.id)
	};
}

/**
 * Fissa l'esame nel giorno e prepara il messaggio di esito.
 * @param {number} userId
 * @param {{ id: number, name: string, cfu: number }} exam
 * @param {string} date
 */
async function schedule(userId, exam, date) {
	const { status, previousDate } = await scheduleExam(userId, exam.id, date);
	return { status, previousDate, exam: { id: exam.id, name: exam.name, cfu: exam.cfu }, date };
}

/** @type {import('./$types').Actions} */
export const actions = {
	add: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const date = str(data.get('date'));
		const examId = parseId(data.get('examId'));

		if (!isIsoDate(date)) return fail(400, { error: 'calendar.errors.invalidDate' });
		if (examId === null) return fail(400, { error: 'calendar.errors.examNotFound' });

		try {
			const exam = await getExam(examId);
			if (!exam) return fail(404, { error: 'calendar.errors.examNotFound' });
			return { action: 'add', ...(await schedule(user.id, exam, date)) };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'calendar.errors.generic' });
		}
	},

	create: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const date = str(data.get('date'));
		const values = { name: normalizeExamName(str(data.get('name'))), cfu: str(data.get('cfu')) };

		if (!isIsoDate(date)) return fail(400, { error: 'calendar.errors.invalidDate', values });

		/** @type {Record<string, string>} */
		const errors = {};
		if (!values.name) errors.name = 'calendar.errors.nameRequired';
		else if (values.name.length > EXAM_NAME_MAX) errors.name = 'calendar.errors.nameTooLong';

		const cfu = /^\d{1,2}$/.test(values.cfu) ? Number(values.cfu) : NaN;
		if (!Number.isInteger(cfu) || cfu < EXAM_CFU_MIN || cfu > EXAM_CFU_MAX)
			errors.cfu = 'calendar.errors.cfuInvalid';

		if (Object.keys(errors).length > 0) return fail(400, { errors, values });

		try {
			const exam = await createExam(user.id, values.name, cfu);
			return {
				action: 'create',
				reused: exam.reused,
				...(await schedule(user.id, exam, date))
			};
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'calendar.errors.generic', values });
		}
	},

	unschedule: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const userExamId = parseId(data.get('userExamId'));
		if (userExamId === null) return fail(400, { error: 'calendar.errors.userExamNotFound' });

		try {
			const done = await unscheduleExam(user.id, userExamId);
			if (!done) return fail(404, { error: 'calendar.errors.userExamNotFound' });
			return { action: 'unschedule', userExamId };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'calendar.errors.generic' });
		}
	}
};
