<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const t = getT();
</script>

<svelte:head>
	<title>{t('meta.dashboardTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="dashboard">
	<header class="dashboard-header">
		<h1 class="dashboard-greeting">{t('dashboard.greeting', { name: data.user.name })}</h1>
		<form class="logout-form" method="POST" action="?/logout" use:enhance>
			<button class="button button-secondary" type="submit">{t('dashboard.logout')}</button>
		</form>
	</header>
</section>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.dashboard-header {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-4);
		padding-bottom: var(--space-4);
		border-bottom: 1px solid var(--color-paper-edge);
	}

	.dashboard-greeting {
		min-width: 0;
		font-family: var(--font-display);
		font-optical-sizing: auto;
		font-weight: 700;
		font-size: clamp(var(--text-2xl), 6vw + 0.5rem, var(--text-3xl));
		line-height: var(--leading-tight);
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}
</style>
