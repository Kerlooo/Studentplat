<script>
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';
	import StatsAverages from '#lib/components/StatsAverages.svelte';
	import StatsSummary from '#lib/components/StatsSummary.svelte';
	import AttemptStats from '#lib/components/AttemptStats.svelte';
	import GradeTrendChart from '#lib/components/GradeTrendChart.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const t = getT();

	let stats = $derived(data.stats);
</script>

<svelte:head>
	<title>{t('meta.statsTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="stats">
	<header class="stats-header">
		<h1 class="stats-title">{t('stats.title')}</h1>
		<p class="stats-intro">{t('stats.intro')}</p>
	</header>

	{#if stats.averages}
		<StatsAverages averages={stats.averages} />
		<GradeTrendChart points={stats.trend} />
		<div class="stats-columns">
			<StatsSummary summary={stats.summary} />
			<AttemptStats attempts={stats.attempts} passedExams={stats.summary.passed} />
		</div>
	{:else}
		<div class="stats-empty paper-ruled">
			<p class="stats-empty-text">{t('stats.empty.text')}</p>
			<a class="button button-primary" href={resolve('/dashboard/exams')}>
				{t('stats.empty.link')}
			</a>
		</div>
		{#if stats.attempts.total > 0}
			<AttemptStats attempts={stats.attempts} passedExams={stats.summary.passed} />
		{/if}
	{/if}
</section>

<style>
	/*
	 * Pagine del libretto una sotto l'altra: prima il totale (medie), poi l'andamento,
	 * infine i due registri. Da 64rem i registri si affiancano, il riepilogo piu' largo
	 * perche' contiene anche la distribuzione dei voti.
	 *
	 *  [ Medie                                  ]
	 *  [ Andamento dei voti                     ]
	 *  [ Riepilogo + distribuzione ] [ Tentativi ]
	 */
	.stats,
	.stats-header {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.stats {
		gap: var(--space-8);
	}

	.stats-header {
		gap: var(--space-2);
	}

	.stats-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	.stats-intro {
		max-width: 60ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.stats-columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: var(--space-8);
		align-items: start;
	}

	.stats-empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-5);
		padding: var(--space-5) var(--space-5) var(--space-6) var(--space-8);
	}

	.stats-empty-text {
		max-width: 60ch;
		font-size: var(--text-md);
		line-height: var(--rule-pitch);
	}

	@media (min-width: 30rem) {
		.stats-empty {
			padding: var(--space-6) var(--space-8) var(--space-8) var(--space-12);
		}
	}

	@media (min-width: 64rem) {
		.stats-columns {
			grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
		}
	}
</style>
