<script>
	import { getNumberFormat, getT } from '#lib/i18n/context.js';
	import { formatGrade } from '#lib/grade-rules.js';
	import DistributionBars from './DistributionBars.svelte';

	/**
	 * Riepilogo del libretto: esami superati e da sostenere, CFU, voti estremi, lodi
	 * e distribuzione dei voti per fasce.
	 *
	 * @type {{ summary: import('#lib/stats.js').Summary }}
	 */
	let { summary } = $props();

	const t = getT();
	const number = getNumberFormat();

	/** @param {number | null} grade */
	const grade = (grade) => formatGrade(grade, t('grades.lodeShort')) ?? '';

	let cfuText = $derived(
		summary.totalCfu
			? t('stats.summary.cfuOf', {
					earned: number(summary.earnedCfu),
					total: number(summary.totalCfu)
				})
			: number(summary.earnedCfu)
	);
</script>

<section class="stats-summary paper-sheet" aria-labelledby="stats-summary-heading">
	<h2 class="stats-summary-heading" id="stats-summary-heading">{t('stats.summary.heading')}</h2>

	<dl class="stats-summary-list">
		<div class="stats-summary-item">
			<dt>{t('stats.summary.passed')}</dt>
			<dd>{number(summary.passed)}</dd>
		</div>
		<div class="stats-summary-item">
			<dt>{t('stats.summary.toTake')}</dt>
			<dd>{number(summary.toTake)}</dd>
		</div>
		<div class="stats-summary-item">
			<dt>{t('stats.summary.cfu')}</dt>
			<dd>{cfuText}</dd>
		</div>
		{#if summary.highest !== null && summary.lowest !== null}
			<div class="stats-summary-item">
				<dt>{t('stats.summary.highest')}</dt>
				<dd>{grade(summary.highest)}</dd>
			</div>
			<div class="stats-summary-item">
				<dt>{t('stats.summary.lowest')}</dt>
				<dd>{grade(summary.lowest)}</dd>
			</div>
		{/if}
		<div class="stats-summary-item">
			<dt>{t('stats.summary.lodes')}</dt>
			<dd>{number(summary.lodes)}</dd>
		</div>
	</dl>

	<DistributionBars bands={summary.distribution} />
</section>

<style>
	/*
	 * Riepilogo come registro: voce a sinistra, valore a destra sulla stessa riga,
	 * ogni voce chiusa dal filetto della pagina. Da 34rem di foglio due colonne.
	 *
	 *  ||  Esami superati        12  |  Esami da sostenere     8
	 *  ||  ------------------------  |  ------------------------
	 */
	.stats-summary {
		container: stats-summary / inline-size;
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		min-width: 0;
		padding: var(--space-5) var(--space-5) var(--space-6) calc(var(--margin-x) + var(--space-5));
	}

	.stats-summary-heading {
		font-size: var(--text-lg);
		color: var(--color-ink);
	}

	.stats-summary-list {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		column-gap: var(--space-8);
		margin: calc(-1 * var(--space-2)) 0 0;
	}

	.stats-summary-item {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0 var(--space-3);
		min-width: 0;
		padding-block: var(--space-2);
		border-bottom: 1px solid var(--color-rule);
	}

	.stats-summary-item dt {
		min-width: 0;
		color: var(--color-text-muted);
	}

	.stats-summary-item dd {
		margin: 0 0 0 auto;
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		line-height: var(--leading-snug);
		color: var(--color-text);
		white-space: nowrap;
	}

	@container stats-summary (min-width: 34rem) {
		.stats-summary-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
