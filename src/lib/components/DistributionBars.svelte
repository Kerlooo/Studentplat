<script>
	import { getNumberFormat, getT } from '#lib/i18n/context.js';
	import { formatGrade } from '#lib/grade-rules.js';

	/**
	 * Distribuzione dei voti per fasce, come barre orizzontali in CSS.
	 * La lunghezza e' relativa alla fascia piu' numerosa; il conteggio e' sempre scritto.
	 *
	 * @type {{ bands: import('#lib/stats.js').GradeBand[] }}
	 */
	let { bands } = $props();

	const t = getT();
	const number = getNumberFormat();

	let maxCount = $derived(Math.max(1, ...bands.map((band) => band.count)));

	/** @param {import('#lib/stats.js').GradeBand} band */
	function shortLabel(band) {
		const lode = t('grades.lodeShort');
		return band.min === band.max
			? formatGrade(band.min, lode)
			: `${formatGrade(band.min, lode)}–${formatGrade(band.max, lode)}`;
	}

	/** @param {import('#lib/stats.js').GradeBand} band */
	function longLabel(band) {
		const lode = t('grades.lode');
		return band.min === band.max
			? formatGrade(band.min, lode)
			: t('stats.distribution.band', { min: band.min, max: band.max });
	}
</script>

<section class="distribution" aria-labelledby="distribution-heading">
	<h3 class="distribution-heading" id="distribution-heading">
		{t('stats.distribution.heading')}
	</h3>

	<ul class="distribution-list">
		{#each bands as band (band.min)}
			<li class="distribution-row">
				<span class="visually-hidden">
					{t('stats.distribution.count', {
						label: longLabel(band) ?? '',
						count: number(band.count)
					})}
				</span>
				<span class="distribution-label" aria-hidden="true">{shortLabel(band)}</span>
				<span class="distribution-track" aria-hidden="true">
					<span class="distribution-bar" style:--share={band.count / maxCount}></span>
				</span>
				<span class="distribution-count" aria-hidden="true">{number(band.count)}</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	/*
	 * Barre orizzontali compatte: un solo colore (e' una quantita', non una categoria),
	 * ancorate a un asse verticale comune, estremita' arrotondata solo dal lato del dato,
	 * 2px tra una barra e l'altra. Fascia e conteggio in colore testo.
	 *
	 *  18–20 |▇▇▇▇▇            2
	 *  21–23 |▇▇▇▇▇▇▇▇▇▇▇      5
	 *  30L   |▇▇               1
	 */
	.distribution {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
	}

	.distribution-heading {
		font-size: var(--text-md);
		line-height: var(--leading-snug);
		color: var(--color-text);
	}

	.distribution-list {
		--bar-row: 1.25rem;

		display: grid;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-sm);
		line-height: var(--bar-row);
	}

	.distribution-row {
		display: grid;
		grid-template-columns: 3.75rem minmax(0, 1fr) 2.5rem;
		align-items: stretch;
		column-gap: var(--space-2);
	}

	.distribution-label {
		font-family: var(--font-display);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--color-text-muted);
		text-align: end;
		white-space: nowrap;
	}

	/* Asse comune: il filetto sinistro del binario, continuo grazie ai 2px di passo */
	.distribution-track {
		display: block;
		min-width: 0;
		height: var(--bar-row);
		border-inline-start: 1px solid var(--color-paper-edge);
	}

	.distribution-row + .distribution-row .distribution-track {
		margin-top: -2px;
		height: calc(var(--bar-row) + 2px);
		padding-top: 2px;
	}

	.distribution-bar {
		display: block;
		width: calc(var(--share) * 100%);
		height: 100%;
		background: var(--color-ink);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}

	.distribution-count {
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--color-text);
		text-align: end;
	}

	@media (forced-colors: active) {
		.distribution-track {
			border-color: CanvasText;
		}

		.distribution-bar {
			background: CanvasText;
		}
	}
</style>
