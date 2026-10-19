import { fail, redirect } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.js';
import {
	addAttempt,
	createExam,
	getAttemptsForUser,
	getCatalogForUser,
	getExam,
	scheduleExam,
	unscheduleExam
} from '#lib/server/exams.js';
import { parseId, str, today } from '#lib/server/form.js';
import { formatMonth, isIsoDate, parseMonth } from '#lib/calendar.js';
import { EXAM_CFU_MAX, EXAM_CFU_MIN, EXAM_NAME_MAX, normalizeExamName } from '#lib/exam-rules.js';
import { NOTES_MAX, isSufficient, parseGradeField } from '#lib/grade-rules.js';
import { parseDifficulty } from '#lib/difficulty-rules.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals, url }) {
	const user = requireUser(locals);
	const todayIso = today();

	const param = url.searchParams.get('month');
	const month = param === null ? parseMonth(todayIso.slice(0, 7)) : parseMonth(param);
	// Mese non valido: si torna al mese corrente invece di mostrare un errore
	if (!month) redirect(303, url.pathname);

	const attempts = await getAttemptsForUser(user.id);
	return {
		month: formatMonth(month),
		today: todayIso,
		catalog: await getCatalogForUser(user.id, attempts),
		attempts
	};
}

/**
 * Fissa l'esame nel giorno e prepara il messaggio di esito.
 * Restituisce null se l'esame e' gia' superato (non si fissa piu').
 * @param {number} userId
 * @param {{ id: number, name: string, cfu: number }} exam
 * @param {string} date
 * @param {import('#lib/difficulty-rules.js').Difficulty | null} difficulty null = lascia quella esistente
 */
async function schedule(userId, exam, date, difficulty) {
	const { status, previousDate } = await scheduleExam(userId, exam.id, date, difficulty);
	if (status === 'passed') return null;
	return { status, previousDate, exam: { id: exam.id, name: exam.name, cfu: exam.cfu }, date };
}

/** @param {{ name: string }} exam */
const alreadyPassed = (exam) =>
	fail(409, { error: 'calendar.errors.alreadyPassed', params: { name: exam.name } });

/** @type {import('./$types').Actions} */
export const actions = {
	add: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const date = str(data.get('date'));
		const examId = parseId(data.get('examId'));
		const difficulty = parseDifficulty(data.get('difficulty'));

		if (!isIsoDate(date)) return fail(400, { error: 'calendar.errors.invalidDate' });
		if (examId === null) return fail(400, { error: 'calendar.errors.examNotFound' });
		if (difficulty === undefined) return fail(400, { error: 'difficulty.errors.invalid' });

		try {
			const exam = await getExam(examId);
			if (!exam) return fail(404, { error: 'calendar.errors.examNotFound' });
			const scheduled = await schedule(user.id, exam, date, difficulty);
			if (!scheduled) return alreadyPassed(exam);
			return { action: 'add', ...scheduled };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'calendar.errors.generic' });
		}
	},

	create: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const date = str(data.get('date'));
		const values = {
			name: normalizeExamName(str(data.get('name'))),
			cfu: str(data.get('cfu')),
			difficulty: str(data.get('difficulty'))
		};
		const difficulty = parseDifficulty(values.difficulty);

		if (!isIsoDate(date)) return fail(400, { error: 'calendar.errors.invalidDate', values });

		/** @type {Record<string, string>} */
		const errors = {};
		if (!values.name) errors.name = 'calendar.errors.nameRequired';
		else if (values.name.length > EXAM_NAME_MAX) errors.name = 'calendar.errors.nameTooLong';

		const cfu = /^\d{1,2}$/.test(values.cfu) ? Number(values.cfu) : NaN;
		if (!Number.isInteger(cfu) || cfu < EXAM_CFU_MIN || cfu > EXAM_CFU_MAX)
			errors.cfu = 'calendar.errors.cfuInvalid';
		if (difficulty === undefined) errors.difficulty = 'difficulty.errors.invalid';

		if (difficulty === undefined || Object.keys(errors).length > 0)
			return fail(400, { errors, values });

		try {
			const exam = await createExam(user.id, values.name, cfu);
			const scheduled = await schedule(user.id, exam, date, difficulty);
			if (!scheduled) return alreadyPassed(exam);
			return { action: 'create', reused: exam.reused, ...scheduled };
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
	},

	attempt: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const date = str(data.get('date'));
		const userExamId = parseId(data.get('userExamId'));
		const values = {
			grade: str(data.get('grade')),
			rejected: data.get('rejected') === 'on',
			notes: str(data.get('notes'))
		};

		if (!isIsoDate(date)) return fail(400, { error: 'calendar.errors.invalidDate' });
		if (date > today()) return fail(400, { error: 'calendar.errors.futureAttempt' });
		if (userExamId === null) return fail(400, { error: 'calendar.errors.userExamNotFound' });

		/** @type {Record<string, string>} */
		const errors = {};
		const grade = parseGradeField(values.grade);
		if (grade === undefined) errors.grade = 'calendar.errors.gradeInvalid';
		else if (values.rejected && !isSufficient(grade))
			errors.rejected = 'calendar.errors.rejectedInsufficient';
		if (values.notes.length > NOTES_MAX) errors.notes = 'calendar.errors.notesTooLong';
		if (grade === undefined || Object.keys(errors).length > 0)
			return fail(400, { errors, values, userExamId });

		try {
			const result = await addAttempt(user.id, userExamId, {
				date,
				grade,
				rejected: values.rejected,
				notes: values.notes || null
			});
			if (result.status === 'notFound')
				return fail(404, { error: 'calendar.errors.userExamNotFound', userExamId });
			if (result.status === 'alreadyPassed')
				return fail(409, {
					error: 'calendar.errors.attemptAlreadyPassed',
					params: { name: result.name },
					values,
					userExamId
				});
			return {
				action: 'attempt',
				exam: { name: result.name, cfu: result.cfu },
				userExamId,
				date,
				grade,
				rejected: values.rejected
			};
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'calendar.errors.generic', values, userExamId });
		}
	}
};
