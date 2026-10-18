<script>
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';
	import TranscriptEntry from '#lib/components/TranscriptEntry.svelte';

	/** @type {import('./$types').PageProps} */
	let { data, form } = $props();

	const t = getT();

	let passed = $derived(data.exams.filter((exam) => exam.passed));
	let toTake = $derived(data.exams.filter((exam) => !exam.passed));

	// Esame toccato dall'ultima azione: resta aperto e riceve l'eventuale messaggio
	let focusId = $derived.by(() => {
		if (!form) return null;
		if ('userExamId' in form && form.userExamId) return form.userExamId;
		if ('attemptId' in form && form.attemptId) {
			const id = form.attemptId;
			return data.exams.find((exam) => exam.attempts.some((a) => a.id === id))?.userExamId ?? null;
		}
		return null;
	});
	let confirmId = $derived(
		form && 'action' in form && form.action === 'confirmDelete' ? form.attemptId : null
	);
	let notice = $derived(
		form && 'action' in form && form.action === 'deleteAttempt'
			? t('transcript.messages.attemptDeleted')
			: null
	);
	let pageError = $derived(form && 'error' in form && form.error ? t(form.error) : null);

	/** @param {number} userExamId */
	function entryProps(userExamId) {
		const own = focusId === userExamId;
		return {
			highlight: own,
			notice: own ? notice : null,
			confirmId: own ? confirmId : null,
			teacherValue: own && form && 'teacher' in form ? form.teacher : undefined,
			teacherError: own && form && 'teacherError' in form ? form.teacherError : undefined,
			teacherSaved: own && !!form && 'action' in form && form.action === 'teacher'
		};
	}
</script>

<svelte:head>
	<title>{t('meta.transcriptTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="transcript">
	<header class="transcript-header">
		<h1 class="transcript-title">{t('transcript.title')}</h1>
		<p class="transcript-intro">{t('transcript.intro')}</p>
	</header>

	{#if pageError}
		<p class="form-error" role="alert">{pageError}</p>
	{/if}

	{#if data.exams.length === 0}
		<div class="transcript-empty paper-ruled">
			<p class="transcript-empty-text">{t('transcript.empty.text')}</p>
			<div class="transcript-empty-actions">
				<a class="button button-primary" href={resolve('/dashboard/calendar')}>
					{t('transcript.empty.calendar')}
				</a>
				<a class="button button-secondary" href="{resolve('/dashboard/profile')}#exam-import">
					{t('transcript.empty.import')}
				</a>
			</div>
		</div>
	{:else}
		<section class="transcript-group" aria-labelledby="transcript-passed">
			<h2 class="transcript-group-title" id="transcript-passed">
				{t('transcript.groups.passed', { count: passed.length })}
			</h2>
			{#if passed.length > 0}
				<ul class="transcript-list">
					{#each passed as exam (exam.userExamId)}
						<li><TranscriptEntry {exam} {...entryProps(exam.userExamId)} /></li>
					{/each}
				</ul>
			{:else}
				<p class="transcript-group-empty">{t('transcript.groups.passedNone')}</p>
			{/if}
		</section>

		<section class="transcript-group" aria-labelledby="transcript-to-take">
			<h2 class="transcript-group-title" id="transcript-to-take">
				{t('transcript.groups.toTake', { count: toTake.length })}
			</h2>
			{#if toTake.length > 0}
				<ul class="transcript-list">
					{#each toTake as exam (exam.userExamId)}
						<li><TranscriptEntry {exam} {...entryProps(exam.userExamId)} /></li>
					{/each}
				</ul>
			{:else}
				<p class="transcript-group-empty">{t('transcript.groups.toTakeNone')}</p>
			{/if}
		</section>
	{/if}
</section>

<style>
	/*
	 * Il libretto: ogni gruppo e' un foglio con il doppio margine rosso,
	 * ogni esame una riga separata dal filetto della pagina (vedi TranscriptEntry).
	 * Il foglio e' un container: le righe passano a colonne in base alla sua larghezza,
	 * non a quella della finestra (che a destra dell'indice e' piu' stretta).
	 */
	.transcript,
	.transcript-header,
	.transcript-group {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.transcript {
		gap: var(--space-10);
	}

	.transcript-header {
		gap: var(--space-2);
	}

	.transcript-group {
		gap: var(--space-4);
	}

	/* Stessa intestazione di calendario e profilo */
	.transcript-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	.transcript-intro {
		max-width: 60ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.transcript-group-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		color: var(--color-text);
	}

	.transcript-group-empty {
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
	}

	.transcript-list {
		--margin-x: var(--space-6);
		container: transcript / inline-size;
		display: flex;
		flex-direction: column;
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		overflow: hidden;
		background-color: var(--color-paper);
		/* Doppio margine rosso, come in .paper-ruled ma senza righe: le righe sono gli esami */
		background-image: linear-gradient(
			to right,
			transparent var(--margin-x),
			var(--color-margin) var(--margin-x),
			var(--color-margin) calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 5px),
			transparent calc(var(--margin-x) + 5px)
		);
		border: 1px solid var(--color-paper-edge);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-pages);
	}

	.transcript-list > li + li {
		border-top: 1px solid var(--color-rule);
	}

	.transcript-empty {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		padding: var(--space-5) var(--space-5) var(--space-6) var(--space-8);
	}

	.transcript-empty-text {
		max-width: 60ch;
		font-size: var(--text-md);
		line-height: var(--rule-pitch);
	}

	.transcript-empty-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	@media (min-width: 30rem) {
		.transcript-list {
			--margin-x: var(--space-8);
		}

		.transcript-empty {
			padding: var(--space-6) var(--space-8) var(--space-8) var(--space-12);
		}

		.transcript-empty-actions {
			flex-direction: row;
			flex-wrap: wrap;
		}
	}
</style>
