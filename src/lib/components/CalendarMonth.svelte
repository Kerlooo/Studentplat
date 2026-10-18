<script>
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { WEEKDAY_SAMPLES, isoToUtcDate, monthWeeks } from '#lib/calendar.js';

	/**
	 * Griglia mensile (tabella, etichettata dal titolo del mese indicato in `labelledby`: righe = settimane da lunedi', colonne = giorni).
	 * Ogni giorno e' un pulsante che chiama `onselect` con la data ISO.
	 *
	 * @type {{
	 * 	month: { year: number, month: number },
	 * 	today: string,
	 * 	examsByDate: Record<string, { id: number, name: string, cfu: number }[]>,
	 * 	labelledby: string,
	 * 	onselect: (date: string) => void,
	 * }}
	 */
	let { month, today, examsByDate, labelledby, onselect } = $props();

	const t = getT();
	const weekdayShort = getDateFormat({ weekday: 'short' });
	const weekdayLong = getDateFormat({ weekday: 'long' });
	const fullDate = getDateFormat({
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});

	let weeks = $derived(monthWeeks(month));

	/**
	 * Etichetta del pulsante: data completa, "oggi" e numero di esami.
	 * @param {string} iso
	 * @param {number} count
	 */
	function dayLabel(iso, count) {
		const parts = [fullDate(isoToUtcDate(iso))];
		if (iso === today) parts.push(t('calendar.today'));
		if (count > 0)
			parts.push(t(count === 1 ? 'calendar.examsOne' : 'calendar.examsMany', { count }));
		return parts.join(', ');
	}
</script>

<table class="calendar-grid" aria-labelledby={labelledby}>
	<thead>
		<tr>
			{#each WEEKDAY_SAMPLES as sample (sample.getTime())}
				<th class="calendar-weekday" scope="col">
					<span aria-hidden="true">{weekdayShort(sample)}</span>
					<span class="visually-hidden">{weekdayLong(sample)}</span>
				</th>
			{/each}
		</tr>
	</thead>
	<tbody>
		{#each weeks as week, w (week.find(Boolean))}
			<tr>
				{#each week as iso, d (iso ?? `empty-${w}-${d}`)}
					{#if iso}
						{@const exams = examsByDate[iso] ?? []}
						<td class="calendar-day" class:is-today={iso === today}>
							<button
								class="calendar-day-button"
								type="button"
								aria-label={dayLabel(iso, exams.length)}
								aria-current={iso === today ? 'date' : undefined}
								onclick={() => onselect(iso)}
							>
								<span class="calendar-day-number">{Number(iso.slice(8))}</span>
								{#if exams.length > 0}
									<span class="calendar-day-exams">
										{#each exams as exam (exam.id)}
											<span class="calendar-day-exam">
												<span class="calendar-day-exam-name">{exam.name}</span>
												<span class="calendar-day-exam-cfu"
													>{t('calendar.cfuShort', { cfu: exam.cfu })}</span
												>
											</span>
										{/each}
									</span>
								{/if}
							</button>
						</td>
					{:else}
						<td class="calendar-day is-outside"></td>
					{/if}
				{/each}
			</tr>
		{/each}
	</tbody>
</table>

<style>
	/*
	 * Pagina di agenda: 7 colonne uguali anche a 360px (circa 45px l'una).
	 * Sotto i giorni della settimana corre la doppia riga rossa del margine,
	 * girata in orizzontale; oggi e' passato con l'evidenziatore.
	 * Su smartphone ogni esame e' un punto d'inchiostro (il nome completo e' nell'aria-label
	 * del pulsante); da 40rem compare come etichetta con nome e CFU.
	 */
	.calendar-grid {
		width: 100%;
		table-layout: fixed;
		border-collapse: collapse;
	}

	.calendar-weekday {
		padding: var(--space-2) var(--space-1);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
		text-align: start;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		/* Doppia riga del margine rosso */
		border-bottom: 3px double var(--color-margin);
	}

	.calendar-day {
		/* Permette al pulsante di riempire tutta l'altezza della riga */
		height: 1px;
		padding: 0;
		vertical-align: top;
		border: 1px solid var(--color-rule);
	}

	/* Bordi esterni: li disegna il foglio che contiene la tabella */
	tr > .calendar-day:first-child {
		border-left: 0;
	}

	tr > .calendar-day:last-child {
		border-right: 0;
	}

	tbody tr:last-child > .calendar-day {
		border-bottom: 0;
	}

	/* Sabato e domenica: colonne appena velate, come in un'agenda */
	.calendar-weekday:nth-child(n + 6),
	.calendar-day:nth-child(n + 6) {
		background: color-mix(in srgb, var(--color-rule) 45%, transparent);
	}

	/* Giorni del mese precedente o successivo: fuori dalla pagina, color scrivania */
	.calendar-day.is-outside,
	.calendar-day.is-outside:nth-child(n + 6) {
		background: color-mix(in srgb, var(--color-bg) 75%, var(--color-paper));
	}

	.calendar-day-button {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: var(--space-1);
		width: 100%;
		height: 100%;
		min-height: 3.5rem;
		padding: var(--space-1);
		border: 0;
		border-radius: 0;
		background: transparent;
		color: var(--color-text);
		font: inherit;
		text-align: start;
		cursor: pointer;
		transition: background-color var(--duration-fast) ease;
	}

	.calendar-day-button:hover {
		background: color-mix(in srgb, var(--color-ink-soft) 55%, transparent);
	}

	/* Il focus resta dentro la cella, cosi' non viene tagliato dalle celle vicine */
	.calendar-day-button:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: -3px;
	}

	.calendar-day-number {
		align-self: flex-start;
		padding: 0 var(--space-1);
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		font-variant-numeric: lining-nums tabular-nums;
		border-radius: var(--radius-xs);
	}

	/* Oggi: passata di evidenziatore sul numero */
	.calendar-day-button[aria-current='date'] .calendar-day-number {
		font-weight: var(--weight-bold);
		color: var(--color-on-highlight);
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left center;
		background-size: 100% 80%;
		animation: today-swipe var(--duration-mark) var(--ease-out);
	}

	@keyframes today-swipe {
		from {
			background-size: 0% 80%;
			color: var(--color-text);
		}
		to {
			background-size: 100% 80%;
		}
	}

	/* Mobile: un punto d'inchiostro per esame */
	.calendar-day-exams {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
		min-width: 0;
		padding-inline: var(--space-1);
	}

	.calendar-day-exam {
		display: block;
		width: 0.5rem;
		height: 0.5rem;
		border-radius: var(--radius-pill);
		background: var(--color-ink);
	}

	.calendar-day-exam-name,
	.calendar-day-exam-cfu {
		display: none;
	}

	@media (min-width: 40rem) {
		.calendar-weekday {
			padding-inline: var(--space-2);
		}

		.calendar-day-button {
			min-height: 6rem;
			padding: var(--space-2);
		}

		/* Etichette d'esame: nome e CFU con il filetto d'inchiostro a sinistra */
		.calendar-day-exams {
			flex-direction: column;
			flex-wrap: nowrap;
			padding-inline: 0;
			font-size: var(--text-sm);
			line-height: var(--leading-snug);
		}

		.calendar-day-exam {
			display: flex;
			flex-wrap: wrap;
			align-items: baseline;
			gap: 0 var(--space-1);
			width: auto;
			height: auto;
			min-width: 0;
			padding: var(--space-1) var(--space-1) var(--space-1) var(--space-2);
			border-left: 3px solid var(--color-ink);
			border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
			background: var(--color-ink-soft);
			color: var(--color-text);
		}

		.calendar-day-exam-name {
			display: block;
			flex: 1 1 auto;
			min-width: 0;
			max-width: 100%;
			font-weight: var(--weight-semibold);
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.calendar-day-exam-cfu {
			display: block;
			font-family: var(--font-display);
			font-variant-numeric: lining-nums tabular-nums;
			color: var(--color-text-muted);
			white-space: nowrap;
		}
	}
</style>
