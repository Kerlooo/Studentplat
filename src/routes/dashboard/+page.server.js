import { requireUser } from '#lib/server/auth.js';
import { getProfile } from '#lib/server/profile.js';
import { getEarnedCfu, getUpcomingExams } from '#lib/server/exams.js';
import { today } from '#lib/server/form.js';

/** Quanti prossimi appelli mostrare in Panoramica. */
const UPCOMING_LIMIT = 3;

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const user = requireUser(locals);
	const [profile, upcoming, earnedCfu] = await Promise.all([
		getProfile(user.id),
		getUpcomingExams(user.id, today(), UPCOMING_LIMIT),
		getEarnedCfu(user.id)
	]);
	return {
		greetingName: user.nickname || user.name,
		degreeCourse: profile?.degreeCourse ?? null,
		university: profile?.university ?? null,
		upcoming,
		earnedCfu,
		totalCfu: profile?.totalCfu ?? null
	};
}
