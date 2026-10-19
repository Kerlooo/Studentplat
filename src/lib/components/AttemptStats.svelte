<script>
	import { getNumberFormat, getT } from '#lib/i18n/context.js';

	/**
	 * Esiti di tutti i tentativi registrati e quota di esami superati al primo tentativo.
	 *
	 * @type {{ attempts: import('#lib/stats.js').AttemptStats, passedExams: number }}
	 */
	let { attempts, passedExams } = $props();

	const t = getT();
	const number = getNumberFormat();
	const percent = getNumberFormat({ style: 'percent', maximumFractionDigits: 0 });

	const outcomes = /** @type {const} */ ([
		['passed', 'stats.attempts.passed'],
		['withdrawn', 'stats.attempts.withdrawn'],
		['failed', 'stats.attempts.failed'],
		['rejected', 'stats.attempts.rejected']
	]);
</script>

<section class="attempt-stats paper-sheet" aria-labelledby="attempt-stats-heading">
	<h2 class="attempt-stats-heading" id="attempt-stats-heading">{t('stats.attempts.heading')}</h2>

	<dl class="attempt-stats-list">
		<div class="attempt-stats-item is-total">
			<dt>{t('stats.attempts.total')}</dt>
			<dd>{number(attempts.total)}</dd>
		</div>
		{#each outcomes as [key, label] (key)}
			<div class="attempt-stats-item is-{key}">
				<dt>{t(label)}</dt>
				<dd>{number(attempts[key])}</dd>
			</div>
		{/each}
		{#if attempts.firstTryRate !== null}
			<div class="attempt-stats-item is-first-try">
				<dt>{t('stats.attempts.firstTry')}</dt>
				<dd>
					{t('stats.attempts.firstTryValue', {
						percent: percent(attempts.firstTryRate),
						count: number(attempts.firstTry),
						total: number(passedExams)
					})}
				</dd>
			</div>
		{/if}
	</dl>
</section>

<style>
	/*
	 * Registro dei tentativi, con le stesse righe del Riepilogo: il totale in testa,
	 * gli esiti rientrati sotto di lui come sue voci, la quota al primo tentativo in fondo.
	 *
	 *  ||  Tentativi registrati          18
	 *  ||  ================================
	 *  ||     Superati                   12
	 *  ||     Ritirati o assenti          3
	 *  ||  --------------------------------
	 *  ||  Esami superati al primo tentativo
	 *  ||                      67% (8 su 12)
	 */
	.attempt-stats {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		min-width: 0;
		padding: var(--space-5) var(--space-5) var(--space-6) calc(var(--margin-x) + var(--space-5));
	}

	.attempt-stats-heading {
		font-size: var(--text-lg);
		color: var(--color-ink);
	}

	.attempt-stats-list {
		display: flex;
		flex-direction: column;
		margin: calc(-1 * var(--space-2)) 0 0;
	}

	.attempt-stats-item {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0 var(--space-3);
		min-width: 0;
		padding-block: var(--space-2);
		border-bottom: 1px solid var(--color-rule);
	}

	.attempt-stats-item dt {
		min-width: 0;
		color: var(--color-text-muted);
	}

	.attempt-stats-item dd {
		margin: 0 0 0 auto;
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		line-height: var(--leading-snug);
		color: var(--color-text);
		white-space: nowrap;
	}

	/* Totale: voce principale, separata dagli esiti da un filetto piu' marcato */
	.is-total {
		border-bottom: 2px solid var(--color-paper-edge);
	}

	.is-total dt {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.is-total dd {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		color: var(--color-ink);
	}

	/* Esiti: rientrati sotto il totale di cui sono la scomposizione */
	.is-passed,
	.is-withdrawn,
	.is-failed,
	.is-rejected {
		padding-inline-start: var(--space-4);
	}

	.is-first-try {
		margin-top: var(--space-3);
		border-top: 1px solid var(--color-rule);
	}

	.is-first-try dt {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.is-first-try dd {
		color: var(--color-ink);
	}
</style>
