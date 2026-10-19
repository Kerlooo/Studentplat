<script module>
	/**
	 * Esame mostrato in un giorno; `outcome` e' l'esito registrato quel giorno, se c'e'.
	 * `difficulty` e' la difficolta' personale (null = non indicata).
	 * @typedef {{
	 * 	id: number,
	 * 	name: string,
	 * 	cfu: number,
	 * 	difficulty?: import('#lib/difficulty-rules.js').Difficulty | null,
	 * 	outcome: { grade: number | null, rejected: boolean } | null,
	 * }} CalendarExam
	 */
</script>

<script>
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { WEEKDAY_SAMPLES, isoToUtcDate, monthWeeks } from '#lib/calendar.js';
	import { attemptOutcome } from '#lib/grade-rules.js';
	import GradeBadge from './GradeBadge.svelte';

	/**
	 * Griglia mensile (tabella, etichettata dal titolo del mese indicato in `labelledby`: righe = settimane da lunedi', colonne = giorni).
	 * Ogni giorno e' un pulsante che chiama `onselect` con la data ISO.
	 * Un esame con esito mostra il voto al posto dei CFU e la classe dell'esito
	 * (`is-passed`, `is-failed`, `is-rejected`, `is-withdrawn`).
	 * Con una difficolta' indicata riceve anche `has-difficulty is-difficulty-<livello>`.
	 *
	 * @type {{
	 * 	month: { year: number, month: number },
	 * 	today: string,
	 * 	examsByDate: Record<string, CalendarExam[]>,
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
											<span
												class="calendar-day-exam {exam.outcome
													? `has-outcome is-${attemptOutcome(exam.outcome)}`
													: ''} {exam.difficulty
													? `has-difficulty is-difficulty-${exam.difficulty}`
													: ''}"
											>
												<span class="calendar-day-exam-name">{exam.name}</span>
												{#if exam.difficulty}
													<span class="visually-hidden"
														>{t('difficulty.srPrefix', {
															level: t(`difficulty.${exam.difficulty}`).toLowerCase()
														})}</span
													>
												{/if}
												{#if exam.outcome}
													<span class="calendar-day-exam-grade">
														<GradeBadge
															grade={exam.outcome.grade}
															rejected={exam.outcome.rejected}
														/>
													</span>
												{:else}
													<span class="calendar-day-exam-cfu"
														>{t('calendar.cfuShort', { cfu: exam.cfu })}</span
													>
												{/if}
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

	/*
	 * Esiti sui punti: forme diverse, non solo colori (come in GradeBadge).
	 * Fissato: punto pieno; superato: quadratino pieno; non superato: cerchio rosso vuoto;
	 * rifiutato: quadratino vuoto; ritirato o assente: trattino.
	 */
	.calendar-day-exam.is-passed {
		border-radius: var(--radius-xs);
	}

	.calendar-day-exam.is-failed {
		border: 2px solid var(--color-danger);
		background: transparent;
	}

	.calendar-day-exam.is-rejected {
		border: 2px solid var(--color-text-muted);
		border-radius: var(--radius-xs);
		background: transparent;
	}

	.calendar-day-exam.is-withdrawn {
		align-self: center;
		height: 2px;
		border-radius: 0;
		background: var(--color-text-muted);
	}

	/*
	 * Difficolta' sul punto di smartphone: un trattino colorato sotto il segno dell'esito,
	 * che resta intatto. La lunghezza segue le tacche di DifficultyBadge
	 * (Facile 1/3, Media 2/3, Difficile tutto il punto): il livello si legge anche
	 * senza distinguere i colori, e il trattino non si confonde con il cerchio rosso
	 * di "non superato".
	 */
	.calendar-day-exam.is-difficulty-easy {
		--difficulty-color: var(--color-difficulty-easy);
		--difficulty-fill: 3px;
	}

	.calendar-day-exam.is-difficulty-medium {
		--difficulty-color: var(--color-difficulty-medium);
		--difficulty-fill: 5px;
	}

	.calendar-day-exam.is-difficulty-hard {
		--difficulty-color: var(--color-difficulty-hard);
		--difficulty-fill: 8px;
	}

	.calendar-day-exam.has-difficulty {
		/* Spessore del contorno dei segni vuoti: il trattino parte dal bordo esterno */
		--dot-border: 0px;

		position: relative;
		/* Spazio per il trattino, cosi' non tocca i punti della riga sotto */
		margin-bottom: 5px;
	}

	.calendar-day-exam.is-failed.has-difficulty,
	.calendar-day-exam.is-rejected.has-difficulty {
		--dot-border: 2px;
	}

	.calendar-day-exam.has-difficulty::after {
		content: '';
		position: absolute;
		top: calc(100% + var(--dot-border) + 2px);
		left: calc(-1 * var(--dot-border));
		width: var(--difficulty-fill);
		height: 3px;
		border-radius: 1px;
		background: var(--difficulty-color);
	}

	/* Ritirato: il segno e' un trattino di 2px centrato, il micro-segno resta alla stessa distanza */
	.calendar-day-exam.is-withdrawn.has-difficulty::after {
		top: calc(100% + 5px);
	}

	.calendar-day-exam-name,
	.calendar-day-exam-cfu,
	.calendar-day-exam-grade {
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

		.calendar-day-exam-cfu,
		.calendar-day-exam-grade {
			display: block;
			font-family: var(--font-display);
			font-variant-numeric: lining-nums tabular-nums;
			color: var(--color-text-muted);
			white-space: nowrap;
		}

		/*
		 * Etichette con esito: il voto (GradeBadge) prende il posto dei CFU
		 * e il filetto a sinistra cambia tratto oltre che colore.
		 */
		.calendar-day-exam.has-outcome {
			align-items: center;
		}

		.calendar-day-exam.is-passed {
			border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
		}

		.calendar-day-exam.is-failed {
			border: 0;
			border-left: 3px solid var(--color-danger);
			background: var(--color-danger-soft);
		}

		.calendar-day-exam.is-rejected {
			border: 0;
			border-left: 3px dashed var(--color-text-muted);
			border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
			background: color-mix(in srgb, var(--color-rule) 70%, transparent);
		}

		.calendar-day-exam.is-withdrawn {
			align-self: stretch;
			height: auto;
			border-left: 3px dotted var(--color-text-muted);
			border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
			background: color-mix(in srgb, var(--color-rule) 70%, transparent);
		}

		/*
		 * Difficolta': fascia interna di 4px a sinistra, accanto al filetto dell'esito
		 * che resta invariato. Il trattino dello smartphone non serve piu'.
		 */
		.calendar-day-exam.has-difficulty {
			margin-bottom: 0;
			padding-inline-start: calc(var(--space-2) + 2px);
			box-shadow: inset 4px 0 0 var(--difficulty-color);
		}

		.calendar-day-exam.has-difficulty::after {
			content: none;
		}
	}

	/*
	 * Contrasto elevato: i colori di sistema cancellano fondi e ombre.
	 * Smartphone: il trattino resta, in CanvasText, con le sue tre lunghezze.
	 * Da 40rem la fascia diventa un bordo destro in CanvasText con un tratto per
	 * livello (punteggiato, tratteggiato, pieno), distinto dal filetto dell'esito a sinistra.
	 */
	@media (forced-colors: active) {
		.calendar-day-exam.has-difficulty::after {
			forced-color-adjust: none;
			background: CanvasText;
		}
	}

	@media (forced-colors: active) and (min-width: 40rem) {
		.calendar-day-exam.has-difficulty {
			border-right: 4px solid CanvasText;
		}

		.calendar-day-exam.is-difficulty-easy {
			border-right-style: dotted;
		}

		.calendar-day-exam.is-difficulty-medium {
			border-right-style: dashed;
		}
	}
</style>
