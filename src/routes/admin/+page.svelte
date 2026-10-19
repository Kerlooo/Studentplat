<script>
	import { getT } from '#lib/i18n/context.js';
	import AdminStats from '#lib/components/AdminStats.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const t = getT();
</script>

<svelte:head>
	<title>{t('admin.meta.overview')} - {t('meta.appName')}</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-page-header">
		<h1 class="admin-page-title">{t('admin.overview.title')}</h1>
		<p class="admin-page-intro">{t('admin.overview.intro')}</p>
	</header>

	<AdminStats stats={data.stats} />
</section>

<style>
	.admin-page,
	.admin-page-header {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.admin-page {
		gap: var(--space-8);
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
</style>
