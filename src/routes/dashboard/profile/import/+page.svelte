<script>
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';
	import { IMPORT_MAX_BYTES, IMPORT_MAX_ITEMS } from '#lib/import-rules.js';
	import ExamImportForm from '#lib/components/ExamImportForm.svelte';

	/** @type {import('./$types').PageProps} */
	let { form } = $props();

	const t = getT();
	const limits = { items: IMPORT_MAX_ITEMS, size: IMPORT_MAX_BYTES / 1024 };
</script>

<svelte:head>
	<title>{t('meta.importTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="import-page">
	<header class="import-header">
		<a class="import-back" href={resolve('/dashboard/profile')}>{t('import.back')}</a>
		<h1 class="import-title">{t('import.title')}</h1>
		<p class="import-intro">{t('import.intro', limits)}</p>
	</header>

	<div class="import-panel">
		<ExamImportForm
			initialText={form?.importText ?? ''}
			errors={form?.importErrors ?? []}
			result={form?.imported ?? null}
		/>
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
