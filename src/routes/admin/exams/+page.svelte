<script>
	import { resolve } from '$app/paths';
	import { getNumberFormat, getT } from '#lib/i18n/context.js';
	import { listHref } from '#lib/admin-rules.js';
	import AdminSearch from '#lib/components/AdminSearch.svelte';
	import Pagination from '#lib/components/Pagination.svelte';
	import CatalogTable from '#lib/components/CatalogTable.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const t = getT();
	const number = getNumberFormat();
	const listPath = resolve('/admin/exams');

	/** @param {number} page */
	const hrefFor = (page) => listHref(listPath, data.q, page);
</script>

<svelte:head>
	<title>{t('admin.meta.exams')} - {t('meta.appName')}</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-page-header">
		<h1 class="admin-page-title">{t('admin.exams.title')}</h1>
		<p class="admin-page-intro">
			{t(data.q ? 'admin.exams.countSearch' : 'admin.exams.count', {
				count: number(data.list.total),
				q: data.q
			})}
		</p>
	</header>

	<AdminSearch
		id="admin-exams-search"
		action={listPath}
		label={t('admin.exams.searchLabel')}
		value={data.q}
	/>

	{#if data.list.items.length > 0}
		<CatalogTable exams={data.list.items} caption={t('admin.exams.title')} />
		<Pagination
			page={data.list.page}
			pages={data.list.pages}
			{hrefFor}
			label={t('admin.pagination.label')}
		/>
	{:else}
		<p class="admin-page-empty">
			{t(data.q ? 'admin.exams.emptySearch' : 'admin.exams.empty')}
		</p>
	{/if}
</section>

<style>
	.admin-page,
	.admin-page-header {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.admin-page {
		gap: var(--space-6);
	}

	.admin-page-header {
		gap: var(--space-2);
	}

	.admin-page-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	.admin-page-intro {
		max-width: 60ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.admin-page-empty {
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
	}
</style>
