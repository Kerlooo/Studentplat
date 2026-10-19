<script>
	import { getNumberFormat, getT } from '#lib/i18n/context.js';

	/**
	 * Medie degli esami superati: la ponderata in evidenza, aritmetica e base di laurea accanto.
	 *
	 * @type {{ averages: import('#lib/stats.js').Averages }}
	 */
	let { averages } = $props();

	const t = getT();
	const average = getNumberFormat({ minimumFractionDigits: 2, maximumFractionDigits: 2 });
	const base = getNumberFormat({ minimumFractionDigits: 1, maximumFractionDigits: 1 });
</script>

<section class="stats-averages paper-sheet" aria-labelledby="stats-averages-heading">
	<h2 class="stats-averages-heading" id="stats-averages-heading">
		{t('stats.averages.heading')}
	</h2>

	<dl class="stats-averages-list">
		<div class="stats-average is-main">
			<dt class="stats-average-label">{t('stats.averages.weighted')}</dt>
			<dd class="stats-average-value">{average(averages.weighted)}</dd>
			<dd class="stats-average-hint">{t('stats.averages.weightedHint')}</dd>
		</div>
		<div class="stats-average">
			<dt class="stats-average-label">{t('stats.averages.arithmetic')}</dt>
			<dd class="stats-average-value">{average(averages.arithmetic)}</dd>
		</div>
		<div class="stats-average">
			<dt class="stats-average-label">{t('stats.averages.graduation')}</dt>
			<dd class="stats-average-value">{base(averages.graduationBase)}</dd>
			<dd class="stats-average-hint">{t('stats.averages.graduationHint')}</dd>
		</div>
	</dl>
</section>

<style>
	/*
	 * Il totale in fondo alla pagina del libretto: la media ponderata scritta grande
	 * in inchiostro e chiusa dalla doppia sottolineatura dei totali, le altre due
	 * medie accanto, ciascuna sulla propria riga. Colonne in base al foglio (container).
	 *
	 * Smartphone:              Da 34rem di foglio:
	 *  || Media ponderata       ||  Media ponderata      | Media aritmetica
	 *  || 27,45                 ||  27,45                | 27,10
	 *  || ====                  ||  =====                | -----------------
	 *  || Ogni voto pesa...     ||  Ogni voto pesa...    | Base di laurea
	 *  || Media aritmetica      ||                       | 100,6
	 *  || 27,10                 ||                       | Media ponderata...
	 */
	.stats-averages {
		container: stats-averages / inline-size;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		min-width: 0;
		padding: var(--space-5) var(--space-5) var(--space-6) calc(var(--margin-x) + var(--space-5));
	}

	.stats-averages-heading {
		font-size: var(--text-lg);
		color: var(--color-ink);
	}

	.stats-averages-list {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		column-gap: var(--space-10);
		margin: 0;
	}

	.stats-average {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		padding-block: var(--space-3);
		border-bottom: 1px solid var(--color-rule);
	}

	.stats-average:last-child {
		border-bottom: 0;
	}

	.stats-average dd {
		margin: 0;
	}

	.stats-average-label {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
	}

	.stats-average-value {
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		line-height: var(--leading-tight);
		color: var(--color-text);
	}

	.stats-average-hint {
		max-width: 32ch;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	/* Media ponderata: il numero da ricordare */
	.is-main {
		padding-block: 0 var(--space-5);
	}

	.is-main .stats-average-value {
		align-self: flex-start;
		padding-bottom: var(--space-2);
		font-size: var(--text-3xl);
		font-weight: var(--weight-bold);
		letter-spacing: -0.02em;
		line-height: 1;
		color: var(--color-ink);
		/* Doppia riga dei totali, larga quanto il numero */
		background-image:
			linear-gradient(var(--color-ink), var(--color-ink)),
			linear-gradient(var(--color-ink), var(--color-ink));
		background-repeat: no-repeat;
		background-size:
			100% 2px,
			100% 2px;
		background-position:
			0 calc(100% - 4px),
			0 100%;
	}

	.is-main .stats-average-hint {
		margin-top: var(--space-1);
	}

	@container stats-averages (min-width: 34rem) {
		.stats-averages-list {
			grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
			grid-template-rows: auto auto;
		}

		/* La colonna destra comincia sulla stessa riga dell'etichetta principale */
		.is-main {
			grid-column: 1;
			grid-row: 1 / span 2;
			padding-block: var(--space-3) 0;
			border-bottom: 0;
		}

		.is-main .stats-average-value {
			font-size: var(--text-4xl);
		}
	}

	@media (forced-colors: active) {
		.is-main .stats-average-value {
			background-image: none;
			border-bottom: 6px double CanvasText;
		}
	}
</style>
