import { fail } from '@sveltejs/kit';
import { requireUser } from '#lib/server/auth.js';
import { deleteAttempt, getTranscript, setDifficulty, setTeacher } from '#lib/server/exams.js';
import { parseId, str, today } from '#lib/server/form.js';
import { TEACHER_MAX } from '#lib/grade-rules.js';
import { parseDifficulty } from '#lib/difficulty-rules.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const user = requireUser(locals);
	return { today: today(), exams: await getTranscript(user.id) };
}

/** @type {import('./$types').Actions} */
export const actions = {
	teacher: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const userExamId = parseId(data.get('userExamId'));
		const teacher = str(data.get('teacher')).replace(/\s+/g, ' ');

		if (userExamId === null) return fail(400, { error: 'transcript.errors.examNotFound' });
		if (teacher.length > TEACHER_MAX)
			return fail(400, {
				userExamId,
				teacher,
				teacherError: 'transcript.errors.teacherTooLong'
			});

		try {
			const done = await setTeacher(user.id, userExamId, teacher || null);
			if (!done) return fail(404, { error: 'transcript.errors.examNotFound' });
			return { action: 'teacher', userExamId };
		} catch (err) {
			console.error(err);
			return fail(500, { userExamId, teacher, teacherError: 'transcript.errors.generic' });
		}
	},

	difficulty: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const userExamId = parseId(data.get('userExamId'));
		const difficulty = parseDifficulty(data.get('difficulty'));

		if (userExamId === null) return fail(400, { error: 'transcript.errors.examNotFound' });
		if (difficulty === undefined)
			return fail(400, { userExamId, difficultyError: 'difficulty.errors.invalid' });

		try {
			const done = await setDifficulty(user.id, userExamId, difficulty);
			if (!done) return fail(404, { error: 'transcript.errors.examNotFound' });
			return { action: 'difficulty', userExamId };
		} catch (err) {
			console.error(err);
			return fail(500, { userExamId, difficultyError: 'difficulty.errors.generic' });
		}
	},

	deleteAttempt: async ({ request, locals }) => {
		const user = requireUser(locals);
		const data = await request.formData();
		const attemptId = parseId(data.get('attemptId'));
		if (attemptId === null) return fail(400, { error: 'transcript.errors.attemptNotFound' });

		// Senza JavaScript il primo invio arriva senza conferma: si chiede di confermare
		if (data.get('confirm') !== '1') return { action: 'confirmDelete', attemptId };

		try {
			const userExamId = await deleteAttempt(user.id, attemptId);
			if (userExamId === null) return fail(404, { error: 'transcript.errors.attemptNotFound' });
			return { action: 'deleteAttempt', attemptId, userExamId };
		} catch (err) {
			console.error(err);
			return fail(500, { error: 'transcript.errors.generic' });
		}
	}
};
