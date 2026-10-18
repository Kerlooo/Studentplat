<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';
	import LanguageSwitcher from '#lib/components/LanguageSwitcher.svelte';

	/** @type {{ lang: import('#lib/i18n/index.js').Lang, isGuest: boolean }} */
	let { lang, isGuest } = $props();

	const t = getT();

	// Link "Accedi" solo per gli ospiti, e non sulla pagina di accesso stessa
	const loginHref = resolve('/login');
	let showLogin = $derived(
		isGuest && page.url.pathname !== new URL(loginHref, page.url.href).pathname
	);
</script>

<header class="site-header">
	<a class="site-brand" href={resolve('/')} aria-label={t('site.home')}>{t('meta.appName')}</a>
	<div class="site-header-actions">
		{#if showLogin}
			<a class="site-login-link" href={loginHref}>{t('site.login')}</a>
		{/if}
		<LanguageSwitcher current={lang} />
	</div>
</header>

<style>
	.site-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		width: 100%;
		max-width: var(--content-max);
		margin-inline: auto;
		padding: var(--space-4) var(--gutter) 0;
	}

	/* Il nome stampato come sulla copertina del libretto */
	.site-brand {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		font-family: var(--font-display);
		font-weight: var(--weight-bold);
		font-size: var(--text-xl);
		color: var(--color-ink);
		text-decoration: none;
	}

	.site-brand:hover {
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	.site-header-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
	}

	.site-login-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding-inline: var(--space-2);
		border-radius: var(--radius-xs);
		font-weight: var(--weight-bold);
		color: var(--color-ink);
		text-decoration: underline;
		text-decoration-thickness: 1px;
		text-decoration-color: var(--color-paper-edge);
		transition: text-decoration-color var(--duration-fast) ease;
	}

	.site-login-link:hover {
		text-decoration-color: currentColor;
		text-decoration-thickness: 2px;
	}
</style>
