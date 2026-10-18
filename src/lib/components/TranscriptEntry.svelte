<script>
	import { resolve } from '$app/paths';
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { isoToUtcDate } from '#lib/calendar.js';
	import AttemptList from './AttemptList.svelte';
	import GradeBadge from './GradeBadge.svelte';
	import TeacherForm from './TeacherForm.svelte';

	/**
	 * Riga del libretto espandibile (`<details>`, funziona anche senza JavaScript):
	 * nel riepilogo nome, CFU, stato, appello, docente e numero di tentativi;
	 * nel dettaglio docente modificabile, storico dei tentativi e link al calendario.
	 *
	 * @type {{
	 * 	exam: import('#lib/server/exams.js').TranscriptExam,
	 * 	highlight?: boolean,
	 * 	notice?: string | null,
	 * 	teacherValue?: string,
	 * 	teacherError?: string,
	 * 	teacherSaved?: boolean,
	 * 	confirmId?: number | null,
	 * }}
	 */
	let {
		exam,
		highlight = false,
		notice = null,
		teacherValue,
		teacherError,
		teacherSaved = false,
		confirmId = null
	} = $props();

	const t = getT();
	const longDate = getDateFormat({ day: 'numeric', month: 'long', year: 'numeric' });

	/** @param {string} iso */
	const formatDay = (iso) => longDate(isoToUtcDate(iso));

	const pagePath = resolve('/dashboard/exams');
	const calendarPath = resolve('/dashboard/calendar');

	// Aperto all'inizio se l'ultima azione riguarda questo esame; poi lo decide l'utente
	// svelte-ignore state_referenced_locally
	let open = $state(highlight);
	$effect(() => {
		if (highlight) open = true;
	});

	let idPrefix = $derived(`transcript-${exam.userExamId}`);
	let lastAttempt = $derived(exam.attempts.at(-1));
	// Mese da aprire nel calendario: appello previsto, superamento o ultimo tentativo
	let calendarMonth = $derived(
		(exam.plannedDate ?? exam.passed?.date ?? lastAttempt?.date)?.slice(0, 7)
	);
	let calendarHref = $derived(
		calendarMonth ? `${calendarPath}?month=${calendarMonth}` : calendarPath
	);
	let calendarLabel = $derived(
		exam.passed
			? 'transcript.calendar.show'
			: exam.plannedDate
				? 'transcript.calendar.showPlanned'
				: 'transcript.calendar.plan'
	);
	let attemptsCount = $derived(exam.attempts.length);
</script>

<details class="transcript-entry is-{exam.status}" class:is-highlight={highlight} bind:open>
	<summary class="transcript-entry-summary">
		<span class="transcript-entry-name">{exam.name}</span>
		<span class="transcript-entry-cfu">{t('calendar.cfuShort', { cfu: exam.cfu })}</span>
		<span class="transcript-entry-status">
			{#if exam.passed}
				<span class="transcript-entry-grade"><GradeBadge grade={exam.passed.grade} /></span>
				<span class="transcript-entry-date"
					>{t('transcript.status.passedOn', { date: formatDay(exam.passed.date) })}</span
				>
			{:else}
				<span class="transcript-entry-state">{t(`transcript.status.${exam.status}`)}</span>
			{/if}
		</span>
		<span class="transcript-entry-meta">
			{#if !exam.passed && exam.plannedDate}
				<span>{t('transcript.planned', { date: formatDay(exam.plannedDate) })}</span>
			{/if}
			{#if exam.teacher}
				<span>{t('transcript.teacherShort', { name: exam.teacher })}</span>
			{/if}
			<span>
				{attemptsCount === 0
					? t('transcript.attemptsNone')
					: t(attemptsCount === 1 ? 'transcript.attemptsOne' : 'transcript.attemptsMany', {
							count: attemptsCount
						})}
			</span>
		</span>
	</summary>

	<div class="transcript-entry-detail">
		{#if notice}
			<p class="transcript-entry-notice" role="status">{notice}</p>
		{/if}

		<TeacherForm
			userExamId={exam.userExamId}
			value={teacherValue ?? exam.teacher ?? ''}
			action="?/teacher"
			{idPrefix}
			error={teacherError}
			saved={teacherSaved}
		/>

		<section class="transcript-entry-attempts" aria-labelledby="{idPrefix}-attempts">
			<h3 class="transcript-entry-heading" id="{idPrefix}-attempts">
				{t('transcript.attempts.title')}
			</h3>
			{#if exam.attempts.length > 0}
				<AttemptList
					attempts={exam.attempts}
					deleteAction="?/deleteAttempt"
					{confirmId}
					cancelHref={pagePath}
				/>
			{:else}
				<p class="transcript-entry-empty">{t('transcript.attempts.none')}</p>
			{/if}
		</section>

		<!-- eslint-disable svelte/no-navigation-without-resolve -- percorso gia' risolto, si aggiunge solo ?month -->
		<a class="transcript-entry-calendar" href={calendarHref}>{t(calendarLabel)}</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>
</details>

<style>
	/*
	 * Una riga del libretto. Il foglio (righe, margine rosso, container `transcript`)
	 * e' l'elenco in /dashboard/exams; qui ogni riga si allinea alle sue colonne:
	 * nel margine la freccia di apertura, poi insegnamento, CFU, data e la casella del voto.
	 *
	 * Smartphone:                     Da 40rem di foglio:
	 *  >  | Insegnamento     | [28]    >  | Insegnamento     | CFU | Data      | [28]
	 *     | 9 CFU  Data      |            | Appello  Docente  Tentativi        |
	 *     | Appello  Docente  Tentativi
	 *
	 * Lo stato (`.transcript-entry-status`) usa display: contents, cosi' voto e data
	 * diventano celle della griglia senza cambiare il markup.
	 */
	.transcript-entry {
		--entry-margin: var(--margin-x, var(--space-6));
	}

	.transcript-entry-summary {
		display: grid;
		grid-template-columns: var(--entry-margin) auto minmax(0, 1fr) auto;
		grid-template-areas:
			'mark name name grade'
			'.    cfu  date grade'
			'.    meta meta meta';
		align-items: baseline;
		gap: var(--space-1) var(--space-3);
		min-height: 2.75rem;
		padding: var(--space-3) var(--space-3) var(--space-3) 0;
		list-style: none;
		cursor: pointer;
		transition: background-color var(--duration-fast) ease;
	}

	/* Safari: niente triangolo nativo, l'indicatore e' quello disegnato sotto */
	.transcript-entry-summary::-webkit-details-marker {
		display: none;
	}

	.transcript-entry-summary:hover {
		background: color-mix(in srgb, var(--color-ink-soft) 50%, transparent);
	}

	/* Focus dentro la riga: il foglio taglia cio' che sporge */
	.transcript-entry-summary:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: -3px;
	}

	/* Freccia nel margine: punta a destra da chiusa, in basso da aperta */
	.transcript-entry-summary::before {
		content: '';
		grid-area: mark;
		align-self: center;
		justify-self: center;
		width: 0.5rem;
		height: 0.5rem;
		margin-inline-start: -0.125rem;
		border-right: 2px solid var(--color-ink);
		border-bottom: 2px solid var(--color-ink);
		transform: rotate(-45deg);
		transition: transform var(--duration-turn) var(--ease-out);
	}

	.transcript-entry[open] > .transcript-entry-summary::before {
		transform: rotate(45deg) translate(-0.125rem, -0.125rem);
	}

	/* Esame non superato: la casella del voto resta da riempire */
	.transcript-entry:not(.is-passed) > .transcript-entry-summary::after {
		content: '';
		grid-area: grade;
		align-self: center;
		width: 2.75rem;
		border-bottom: 2px dashed var(--color-paper-edge);
	}

	.transcript-entry-name {
		grid-area: name;
		min-width: 0;
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		overflow-wrap: anywhere;
	}

	.transcript-entry-cfu {
		grid-area: cfu;
		font-family: var(--font-display);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.transcript-entry-status {
		display: contents;
	}

	.transcript-entry-grade {
		grid-area: grade;
		align-self: center;
		justify-self: end;
		font-size: var(--text-lg);
	}

	.transcript-entry-date,
	.transcript-entry-state {
		grid-area: date;
		min-width: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	/* "Non superato": in rosso e in grassetto, non solo per colore */
	.is-failed .transcript-entry-state {
		font-weight: var(--weight-bold);
		color: var(--color-danger);
	}

	.transcript-entry-meta {
		grid-area: meta;
		display: flex;
		flex-wrap: wrap;
		gap: 0 var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	/* Ultimo esame toccato: passata di evidenziatore sul nome */
	.is-highlight .transcript-entry-name {
		justify-self: start;
		color: var(--color-on-highlight);
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left 60%;
		background-size: 100% 70%;
		animation: entry-swipe var(--duration-mark) var(--ease-out);
	}

	@keyframes entry-swipe {
		from {
			background-size: 0% 70%;
			color: var(--color-text);
		}
	}

	.transcript-entry[open] > .transcript-entry-summary {
		border-bottom: 1px dashed var(--color-paper-edge);
	}

	/* Dettaglio: allineato alla colonna dell'insegnamento, oltre il margine */
	.transcript-entry-detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		padding: var(--space-5) var(--space-3) var(--space-6) calc(var(--entry-margin) + var(--space-3));
		background: color-mix(in srgb, var(--color-rule) 30%, transparent);
	}

	.transcript-entry-detail > :global(*) {
		max-width: 40rem;
	}

	.transcript-entry-notice {
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--color-ink);
		border-radius: var(--radius-xs);
		background: var(--color-ink-soft);
		color: var(--color-text);
		font-weight: var(--weight-semibold);
		animation: notice-in var(--duration-mark) var(--ease-out);
	}

	@keyframes notice-in {
		from {
			opacity: 0;
			transform: translateY(-0.25rem);
		}
	}

	.transcript-entry-attempts {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}

	.transcript-entry-heading {
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		color: var(--color-text);
	}

	.transcript-entry-empty {
		max-width: 60ch;
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
	}

	.transcript-entry-calendar {
		align-self: flex-start;
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		font-weight: var(--weight-bold);
		color: var(--color-ink);
		text-decoration-thickness: 1px;
	}

	.transcript-entry-calendar:hover {
		color: var(--color-ink-strong);
		text-decoration-thickness: 2px;
	}

	@container transcript (min-width: 40rem) {
		.transcript-entry-summary {
			grid-template-columns:
				var(--entry-margin) minmax(0, 1fr) 4.5rem minmax(9rem, 13rem)
				4.5rem;
			grid-template-areas:
				'mark name cfu  date grade'
				'.    meta meta meta grade';
			padding-inline-end: var(--space-4);
		}

		.transcript-entry-cfu {
			text-align: end;
		}

		.transcript-entry-detail {
			padding-inline-end: var(--space-4);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.transcript-entry-summary::before {
			transition: none;
		}
	}
</style>
