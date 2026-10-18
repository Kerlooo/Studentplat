<script>
	import { resolve } from '$app/paths';
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { isoToUtcDate } from '#lib/calendar.js';

	/**
	 * Prossimi appelli del libretto (gia' filtrati e ordinati dal server).
	 * Ogni voce porta al calendario sul mese dell'appello.
	 *
	 * @type {{ exams: import('#lib/server/exams.js').UpcomingExam[] }}
	 */
	let { exams } = $props();

	const t = getT();
	const longDate = getDateFormat({ weekday: 'long', day: 'numeric', month: 'long' });
	const calendarPath = resolve('/dashboard/calendar');

	/** @param {number} days */
	function countdown(days) {
		if (days <= 0) return t('dashboard.overview.upcoming.today');
		if (days === 1) return t('dashboard.overview.upcoming.tomorrow');
		// Da 2 in su il plurale e' lo stesso in italiano e in inglese
		return t('dashboard.overview.upcoming.inDays', { count: days });
	}
</script>

<section class="upcoming paper-ruled" aria-labelledby="upcoming-heading">
	<h2 class="upcoming-heading" id="upcoming-heading">
		{t('dashboard.overview.upcoming.heading')}
	</h2>

	{#if exams.length > 0}
		<ol class="upcoming-list">
			{#each exams as exam (exam.userExamId)}
				<li class="upcoming-item" class:is-soon={exam.daysLeft <= 1}>
					<!-- eslint-disable svelte/no-navigation-without-resolve -- percorso gia' risolto, si aggiunge solo ?month -->
					<a class="upcoming-link" href="{calendarPath}?month={exam.plannedDate.slice(0, 7)}">
						<span class="upcoming-countdown">{countdown(exam.daysLeft)}</span>
						<span class="upcoming-name">{exam.name}</span>
						<span class="upcoming-meta">
							<time datetime={exam.plannedDate}>{longDate(isoToUtcDate(exam.plannedDate))}</time>
							<span class="upcoming-cfu">{t('calendar.cfuShort', { cfu: exam.cfu })}</span>
						</span>
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				</li>
			{/each}
		</ol>
	{:else}
		<p class="upcoming-empty">{t('dashboard.overview.upcoming.empty')}</p>
		<a class="button button-secondary" href={calendarPath}>
			{t('dashboard.overview.upcoming.plan')}
		</a>
	{/if}
</section>

<style>
	/*
	 * Prossimi appelli scritti sulle righe del libretto.
	 * Ogni riga di testo e' alta un passo (--rule-pitch, 28px) e non ci sono gap
	 * verticali: padding di un rigo sopra e sotto, line-height pari al passo.
	 * Le linee di base cadono 6-9px sopra il fondo del rigo (Source Serif 18-21px
	 * ~7px, Atkinson 14-16px ~8-9px): le righe salgono di 4px (--rule-shift)
	 * e passano appena sotto la scrittura, come nella vetrina.
	 *
	 * Ogni appello e' su tre righi: quando (in inchiostro, evidenziato se e' oggi
	 * o domani), insegnamento, data e CFU. La voce che inizia sempre col conto
	 * alla rovescia separa gli appelli senza bisogno di divisori.
	 */
	.upcoming {
		--rule-shift: -0.25rem;

		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
		padding: var(--rule-pitch) var(--space-5) var(--rule-pitch) var(--space-8);
		line-height: var(--rule-pitch);
		background-position: 0 var(--rule-shift);
	}

	.upcoming-heading {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		line-height: var(--rule-pitch);
		color: var(--color-ink);
	}

	.upcoming-list {
		display: flex;
		flex-direction: column;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	/* L'area cliccabile sborda appena ai lati per non incollare lo sfondo al testo */
	.upcoming-link {
		display: grid;
		margin-inline: calc(-1 * var(--space-2));
		padding-inline: var(--space-2);
		border-radius: var(--radius-xs);
		color: inherit;
		text-decoration: none;
		overflow-wrap: anywhere;
		transition: background-color var(--duration-fast) ease;
	}

	.upcoming-link:hover {
		background: color-mix(in srgb, var(--color-ink-soft) 50%, transparent);
	}

	.upcoming-link:hover .upcoming-name {
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.2em;
	}

	.upcoming-countdown {
		justify-self: start;
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-ink);
	}

	/* Oggi o domani: passata di evidenziatore, solo sulla parte centrale del rigo */
	.is-soon .upcoming-countdown {
		padding-inline: var(--space-1);
		margin-inline-start: calc(-1 * var(--space-1));
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left 55%;
		background-size: 100% 65%;
		color: var(--color-on-highlight);
	}

	.upcoming-name {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.upcoming-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0 var(--space-4);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.upcoming-cfu {
		font-weight: var(--weight-semibold);
		white-space: nowrap;
	}

	.upcoming-empty {
		max-width: 60ch;
	}

	/* Pulsante alto due righi, con il bordo inferiore sulla riga */
	.upcoming > .button {
		margin-top: calc(2 * var(--rule-pitch) - 2.75rem + var(--rule-shift));
		margin-bottom: calc(-1 * var(--rule-shift));
	}

	@media (min-width: 30rem) {
		.upcoming {
			padding-inline: var(--space-12) var(--space-8);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.upcoming-link {
			transition: none;
		}
	}
</style>
