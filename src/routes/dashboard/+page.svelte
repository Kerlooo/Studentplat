<script>
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const t = getT();

	let hasStudies = $derived(!!(data.degreeCourse || data.university));
</script>

<svelte:head>
	<title>{t('meta.dashboardTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="overview">
	<h1 class="overview-greeting">{t('dashboard.greeting', { name: data.greetingName })}</h1>

	{#if hasStudies}
		<!-- Il frontespizio del libretto: corso in evidenza, ateneo sotto -->
		<div class="overview-studies paper-ruled">
			<h2 class="visually-hidden">{t('dashboard.overview.studiesHeading')}</h2>
			{#if data.degreeCourse}
				<p class="overview-degree">{data.degreeCourse}</p>
			{/if}
			{#if data.university}
				<p class="overview-university">{data.university}</p>
			{/if}
		</div>
	{:else}
		<div class="overview-empty paper-ruled">
			<p class="overview-empty-text">{t('dashboard.overview.emptyProfile')}</p>
			<a class="button button-primary" href={resolve('/dashboard/profile')}>
				{t('dashboard.overview.completeProfile')}
			</a>
		</div>
	{/if}
</section>

<style>
	.overview {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.overview-greeting {
		max-width: 20ch;
		font-family: var(--font-display);
		font-optical-sizing: auto;
		font-weight: var(--weight-bold);
		font-size: clamp(var(--text-2xl), 6vw + 0.5rem, var(--text-3xl));
		line-height: var(--leading-tight);
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	/*
	 * Frontespizio del libretto: corso e ateneo scritti in inchiostro sulle righe.
	 * Qui il rigo e' piu' largo del normale e ogni riga di testo occupa
	 * esattamente un rigo; lo spostamento verticale porta le righe
	 * appena sotto la linea di base del testo.
	 */
	.overview-studies {
		--rule-pitch: 2.5rem;
		--rule-shift: -6px;

		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 40rem;
		padding: var(--rule-pitch) var(--space-5) var(--rule-pitch) var(--space-8);
		background-position: 0 var(--rule-shift);
	}

	.overview-degree {
		font-family: var(--font-display);
		font-optical-sizing: auto;
		font-weight: var(--weight-semibold);
		font-size: var(--text-xl);
		line-height: var(--rule-pitch);
		color: var(--color-ink);
	}

	.overview-university {
		font-size: var(--text-base);
		line-height: var(--rule-pitch);
		color: var(--color-text-muted);
	}

	.overview-empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-4);
		width: 100%;
		max-width: var(--panel-max);
		padding: var(--space-5) var(--space-5) var(--space-6) var(--space-8);
	}

	.overview-empty-text {
		max-width: 60ch;
		font-size: var(--text-md);
	}

	@media (min-width: 30rem) {
		.overview-studies {
			padding-inline: var(--space-12) var(--space-8);
		}

		.overview-empty {
			padding: var(--space-6) var(--space-8) var(--space-8) var(--space-12);
		}
	}

	@media (min-width: 48rem) {
		.overview-studies {
			--rule-pitch: 3.5rem;
			--rule-shift: -12px;
		}

		.overview-degree {
			font-size: var(--text-2xl);
		}

		.overview-university {
			font-size: var(--text-md);
		}
	}
</style>
