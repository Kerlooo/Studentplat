<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';
	import { IMPORT_MAX_BYTES, IMPORT_MAX_ITEMS } from '#lib/import-rules.js';
	import ExamImportForm from '#lib/components/ExamImportForm.svelte';
	import TabNav from '#lib/components/TabNav.svelte';

	/** @type {import('./$types').PageProps} */
	let { form } = $props();

	const t = getT();
	const limits = { items: IMPORT_MAX_ITEMS, size: IMPORT_MAX_BYTES / 1024 };

	/** Scheda attiva: quella dell'ultimo invio, altrimenti `?tab=`, altrimenti esami sostenuti. */
	let tab = $derived(
		form?.form ?? (page.url.searchParams.get('tab') === 'planned' ? 'planned' : 'passed')
	);

	let tabs = $derived([
		{
			id: 'passed',
			href: resolve('/dashboard/profile/import?tab=passed'),
			label: t('import.tabs.passed')
		},
		{
			id: 'planned',
			href: resolve('/dashboard/profile/import?tab=planned'),
			label: t('import.tabs.planned')
		}
	]);

	// L'esito e gli errori valgono solo per la scheda del form inviato
	let sent = $derived(form?.form === tab ? form : null);
</script>

<svelte:head>
	<title>{t('meta.importTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="import-page">
	<header class="import-header">
		<a class="import-back" href={resolve('/dashboard/profile')}>{t('import.back')}</a>
		<h1 class="import-title">
			{tab === 'planned' ? t('import.planned.title') : t('import.title')}
		</h1>
		<p class="import-intro">
			{tab === 'planned' ? t('import.planned.intro', limits) : t('import.intro', limits)}
		</p>
	</header>

	<div class="import-panel">
		<TabNav label={t('import.tabs.label')} {tabs} current={tab} />

		{#key tab}
			<ExamImportForm
				kind={tab}
				initialText={sent?.importText ?? ''}
				errors={sent?.importErrors ?? []}
				result={sent?.imported ?? null}
			/>
		{/key}
	</div>
</section>

<style>
	.import-page {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.import-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
	}

	.import-back {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		color: var(--color-ink);
		font-weight: var(--weight-semibold);
	}

	.import-title {
		font-weight: var(--weight-bold);
		letter-spacing: -0.01em;
		font-size: var(--text-2xl);
		line-height: var(--leading-tight);
		color: var(--color-ink);
	}

	.import-intro {
		max-width: 60ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	/*
	 * Stesso foglio del profilo con il doppio margine rosso,
	 * ma senza righe (il codice non sta sulle righe della pagina).
	 */
	.import-panel {
		--margin-x: var(--space-4);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		width: 100%;
		max-width: 36rem;
		min-width: 0;
		padding: var(--space-5) var(--space-5) var(--space-8) var(--space-8);
		background-color: var(--color-paper);
		background-image: linear-gradient(
			to right,
			transparent var(--margin-x),
			var(--color-margin) var(--margin-x),
			var(--color-margin) calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 5px),
			transparent calc(var(--margin-x) + 5px)
		);
		border: 1px solid var(--color-paper-edge);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-pages);
	}

	@media (min-width: 30rem) {
		.import-panel {
			--margin-x: var(--space-8);
			padding: var(--space-6) var(--space-8) var(--space-10) var(--space-12);
		}
	}
</style>
