<script>
	import { getDateFormat, getNumberFormat, getT } from '#lib/i18n/context.js';
	import { GRADE_LODE, PASS_MIN, formatGrade } from '#lib/grade-rules.js';
	import { isoToUtcDate } from '#lib/calendar.js';

	/**
	 * Andamento dei voti: un punto per esame superato e la linea della media ponderata cumulativa.
	 * SVG statico generato in SSR, senza JavaScript; i dati sono ripetuti in una tabella
	 * per gli screen reader. Con un solo esame compare solo il punto.
	 *
	 * Asse X equispaziato (un passo per esame, in ordine di data) invece che temporale:
	 * gli esami si concentrano nelle sessioni e una scala temporale ammasserebbe i punti
	 * di gennaio-febbraio e giugno-luglio lasciando mesi vuoti; la media cumulativa
	 * cambia a ogni esame, non col passare del tempo. Esami nello stesso giorno restano distinti.
	 *
	 * @type {{ points: import('#lib/stats.js').TrendPoint[] }}
	 */
	let { points } = $props();

	const t = getT();
	const average = getNumberFormat({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const longDate = getDateFormat({ day: 'numeric', month: 'long', year: 'numeric' });
	const dayMonth = getDateFormat({ day: 'numeric', month: 'short' });
	const yearOnly = getDateFormat({ year: 'numeric' });
	const uid = $props.id();

	// Geometria in unita' del viewBox: il disegno si adatta alla larghezza del contenitore
	const WIDTH = 640;
	const HEIGHT = 300;
	// A destra c'e' lo spazio per l'etichetta diretta della media accanto all'ultimo punto
	const PAD = { top: 16, right: 56, bottom: 48, left: 48 };
	const PLOT_W = WIDTH - PAD.left - PAD.right;
	const PLOT_H = HEIGHT - PAD.top - PAD.bottom;
	const BASELINE = PAD.top + PLOT_H;
	// Al massimo tante date sull'asse X; le altre restano nei titoli dei punti e nella tabella
	const MAX_LABELS = 6;
	// Righe dell'asse Y: gli estremi delle fasce della distribuzione, piu' la lode
	const Y_TICKS = [PASS_MIN, 21, 24, 27, 30, GRADE_LODE];

	/** @param {number} grade */
	const y = (grade) => PAD.top + ((GRADE_LODE - grade) / (GRADE_LODE - PASS_MIN)) * PLOT_H;
	/** @param {number} index */
	const x = (index) => PAD.left + ((index + 0.5) * PLOT_W) / points.length;
	/** @param {number} value */
	const coord = (value) => Math.round(value * 10) / 10;

	/** @param {number} grade */
	const shortGrade = (grade) => formatGrade(grade, t('grades.lodeShort')) ?? '';
	/** @param {number} grade */
	const longGrade = (grade) => formatGrade(grade, t('grades.lode')) ?? '';

	let plotted = $derived(
		points.map((point, index) => ({
			...point,
			key: `${point.date}-${point.name}-${point.cfu}`,
			cx: coord(x(index)),
			cy: coord(y(point.grade)),
			ay: coord(y(point.cumulativeWeighted)),
			label: longDate(isoToUtcDate(point.date))
		}))
	);

	let averagePath = $derived(
		plotted.length > 1
			? plotted.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx} ${p.ay}`).join(' ')
			: null
	);

	// Date sull'asse X: un'etichetta ogni `step` esami, senza ripetere lo stesso giorno;
	// l'anno compare sotto solo quando cambia
	let xLabels = $derived.by(() => {
		const step = Math.ceil(plotted.length / MAX_LABELS);
		/** @type {{ key: string, x: number, day: string, year: string | null }[]} */
		const labels = [];
		let lastDate = '';
		let lastYear = '';
		plotted.forEach((p, i) => {
			if (i % step !== 0 || p.date === lastDate) return;
			const date = isoToUtcDate(p.date);
			const year = p.date.slice(0, 4);
			labels.push({
				key: p.key,
				x: p.cx,
				day: dayMonth(date),
				year: year !== lastYear ? yearOnly(date) : null
			});
			lastDate = p.date;
			lastYear = year;
		});
		return labels;
	});

	let description = $derived.by(() => {
		const first = plotted[0];
		const last = plotted[plotted.length - 1];
		if (!first || !last) return '';
		if (plotted.length === 1)
			return t('stats.trend.descOne', { date: first.label, grade: longGrade(first.grade) });
		return t('stats.trend.desc', {
			count: plotted.length,
			first: first.label,
			last: last.label,
			start: average(first.cumulativeWeighted),
			end: average(last.cumulativeWeighted)
		});
	});
</script>

<section class="trend paper-sheet" aria-labelledby="{uid}-heading">
	<h2 class="trend-heading" id="{uid}-heading">{t('stats.trend.heading')}</h2>

	<!-- Legenda solo visiva: per gli screen reader ci sono descrizione e tabella -->
	<ul class="trend-legend" aria-hidden="true">
		<li class="trend-legend-item is-grade">{t('stats.trend.legendGrade')}</li>
		{#if averagePath}
			<li class="trend-legend-item is-average">{t('stats.trend.legendAverage')}</li>
		{/if}
	</ul>

	<div class="trend-frame">
		<svg
			class="trend-chart"
			viewBox="0 0 {WIDTH} {HEIGHT}"
			role="img"
			aria-labelledby="{uid}-title {uid}-desc"
		>
			<title id="{uid}-title">{t('stats.trend.heading')}</title>
			<desc id="{uid}-desc">{description}</desc>

			<g class="trend-grid">
				{#each Y_TICKS as tick (tick)}
					<line x1={PAD.left} x2={WIDTH - PAD.right} y1={coord(y(tick))} y2={coord(y(tick))} />
					<text class="trend-tick" x={PAD.left - 10} y={coord(y(tick))} dy="0.35em">
						{shortGrade(tick)}
					</text>
				{/each}
			</g>

			<g class="trend-x-axis">
				<line
					class="trend-baseline"
					x1={PAD.left}
					x2={WIDTH - PAD.right}
					y1={BASELINE}
					y2={BASELINE}
				/>
				{#each xLabels as label (label.key)}
					<text class="trend-date" x={label.x} y={BASELINE + 20}>
						<tspan x={label.x}>{label.day}</tspan>
						{#if label.year}<tspan x={label.x} dy="1.2em">{label.year}</tspan>{/if}
					</text>
				{/each}
			</g>

			{#if averagePath}
				{@const last = plotted[plotted.length - 1]}
				<path class="trend-average" d={averagePath} />
				<!-- Etichetta diretta della linea: fuori dall'area dei punti, mai sopra un marcatore -->
				<text class="trend-average-label" x={last.cx + 12} y={last.ay} dy="0.35em">
					{average(last.cumulativeWeighted)}
				</text>
			{/if}

			<g class="trend-points">
				{#each plotted as p (p.key)}
					<!-- Gruppo per punto: il cerchio trasparente piu' grande e' l'area di hover -->
					<g class="trend-hit">
						<title>
							{t('stats.trend.point', { name: p.name, grade: longGrade(p.grade), date: p.label })}
						</title>
						<circle class="trend-hit-area" cx={p.cx} cy={p.cy} r="14" />
						<circle
							class="trend-point"
							class:is-lode={p.grade === GRADE_LODE}
							cx={p.cx}
							cy={p.cy}
							r="6"
						/>
					</g>
				{/each}
			</g>
		</svg>
	</div>

	<table class="visually-hidden">
		<caption>{t('stats.trend.caption')}</caption>
		<thead>
			<tr>
				<th scope="col">{t('stats.trend.date')}</th>
				<th scope="col">{t('stats.trend.exam')}</th>
				<th scope="col">{t('stats.trend.cfu')}</th>
				<th scope="col">{t('stats.trend.grade')}</th>
				<th scope="col">{t('stats.trend.average')}</th>
			</tr>
		</thead>
		<tbody>
			{#each plotted as p (p.key)}
				<tr>
					<td><time datetime={p.date}>{p.label}</time></td>
					<th scope="row">{p.name}</th>
					<td>{p.cfu}</td>
					<td>{longGrade(p.grade)}</td>
					<td>{average(p.cumulativeWeighted)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</section>

<style>
	/*
	 * Foglio col doppio margine: le righe orizzontali del grafico sono le righe
	 * della pagina (stesso colore recessivo), i voti punti d'inchiostro, la media
	 * una linea tratteggiata a matita con il suo valore finale scritto in fondo.
	 * Testi di assi ed etichette sempre nei colori del testo, mai in quello della serie.
	 *
	 *  ||  30L ---------------------------------------
	 *  ||  30  ------------o-------------o------------
	 *  ||  27  ------o - - - - - - - - - - - - - 27,45
	 *  ||  24  --o----------------o-------------------
	 *  ||  18  _______________________________________
	 *  ||      12 feb      20 giu      15 set
	 */
	.trend {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
		padding: var(--space-5) var(--space-5) var(--space-6) calc(var(--margin-x) + var(--space-5));
	}

	.trend-heading {
		font-size: var(--text-lg);
		color: var(--color-ink);
	}

	.trend-legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-6);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.trend-legend-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
	}

	.trend-legend-item::before {
		content: '';
		flex: none;
	}

	/* Stesso marcatore del grafico: punto d'inchiostro con l'anello del foglio */
	.trend-legend-item.is-grade::before {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		background: var(--color-ink);
	}

	.trend-legend-item.is-average::before {
		width: 1.75rem;
		border-top: 2px dashed var(--color-text-muted);
	}

	/* Sotto una certa larghezza il grafico scorre nel suo riquadro, non la pagina */
	.trend-frame {
		min-width: 0;
		overflow-x: auto;
		overscroll-behavior-x: contain;
	}

	.trend-chart {
		display: block;
		width: 100%;
		min-width: 30rem;
		max-width: 56rem;
		height: auto;
		font-family: var(--font-body);
		font-variant-numeric: lining-nums tabular-nums;
	}

	/* Griglia: righe della pagina, appena piu' marcate del rigo di sfondo */
	.trend-grid line {
		stroke: color-mix(in srgb, var(--color-rule) 55%, var(--color-paper-edge));
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
		shape-rendering: crispEdges;
	}

	.trend-baseline {
		stroke: var(--color-paper-edge);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
		shape-rendering: crispEdges;
	}

	.trend-tick,
	.trend-date {
		fill: var(--color-text-muted);
		font-size: 13px;
	}

	.trend-tick {
		text-anchor: end;
	}

	.trend-date {
		text-anchor: middle;
	}

	.trend-average {
		fill: none;
		stroke: var(--color-text-muted);
		stroke-width: 2;
		stroke-dasharray: 6 4;
		stroke-linecap: round;
		stroke-linejoin: round;
		vector-effect: non-scaling-stroke;
	}

	/* Valore finale della media: in colore testo, con un alone del foglio sopra le righe */
	.trend-average-label {
		fill: var(--color-text);
		font-size: 13px;
		font-weight: var(--weight-semibold);
		paint-order: stroke;
		stroke: var(--color-paper);
		stroke-width: 4px;
		stroke-linejoin: round;
	}

	/*
	 * Punto: l'anello di 2px nel colore del foglio sta fuori dal riempimento
	 * (tratto di 4px dipinto sotto), cosi' il punto si stacca dalla linea della media.
	 */
	.trend-point {
		fill: var(--color-ink);
		stroke: var(--color-paper);
		stroke-width: 4px;
		paint-order: stroke;
		vector-effect: non-scaling-stroke;
		transform-box: fill-box;
		transform-origin: center;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.trend-point.is-lode {
		fill: var(--color-ink-strong);
	}

	/* Area di hover piu' grande del marcatore, invisibile */
	.trend-hit-area {
		fill: transparent;
		stroke: none;
	}

	.trend-hit {
		cursor: default;
	}

	.trend-hit:hover .trend-point {
		fill: var(--color-ink-strong);
		stroke: var(--color-highlight);
		transform: scale(1.35);
	}

	@media (prefers-reduced-motion: reduce) {
		.trend-point {
			transition: none;
		}
	}

	@media (forced-colors: active) {
		.trend-point {
			fill: CanvasText;
			stroke: Canvas;
		}

		.trend-hit:hover .trend-point {
			fill: Highlight;
			stroke: Canvas;
		}

		.trend-average {
			stroke: CanvasText;
		}

		.trend-average-label {
			fill: CanvasText;
			stroke: Canvas;
		}
	}
</style>
