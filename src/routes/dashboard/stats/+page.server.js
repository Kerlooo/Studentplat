import { requireUser } from '#lib/server/auth.js';
import { getTranscript } from '#lib/server/exams.js';
import { getProfile } from '#lib/server/profile.js';
import { computeStats } from '#lib/stats.js';

/** @type {import('./$types').PageServerLoad} */
export async function load({ locals }) {
	const user = requireUser(locals);
	const [exams, profile] = await Promise.all([getTranscript(user.id), getProfile(user.id)]);
	// Al client arrivano solo i numeri gia' calcolati, non il libretto completo
	return { stats: computeStats(exams, profile?.totalCfu ?? null) };
}
