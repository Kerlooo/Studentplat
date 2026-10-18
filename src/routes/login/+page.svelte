<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';
	import LoginForm from '#lib/components/LoginForm.svelte';
	import RegisterForm from '#lib/components/RegisterForm.svelte';

	/** @type {import('./$types').PageProps} */
	let { form } = $props();

	const t = getT();

	/** Scheda attiva: quella dell'ultimo invio fallito, altrimenti `?tab=`, altrimenti login. */
	let tab = $derived(
		form?.form ?? (page.url.searchParams.get('tab') === 'register' ? 'register' : 'login')
	);
</script>

<svelte:head>
	<title>{t('meta.loginTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="login-page">
	<header class="login-intro">
		<h1 class="login-title">{t('meta.appName')}</h1>
		<p class="login-tagline">{t('auth.tagline')}</p>
	</header>

	<div class="auth-panel paper-ruled">
		<nav class="auth-tabs" aria-label={t('auth.tabs.label')}>
			<a
				class="auth-tab"
				href={resolve('/login?tab=login')}
				aria-current={tab === 'login' ? 'page' : undefined}
				data-sveltekit-replacestate
				data-sveltekit-noscroll
			>
				{t('auth.tabs.login')}
			</a>
			<a
				class="auth-tab"
				href={resolve('/login?tab=register')}
				aria-current={tab === 'register' ? 'page' : undefined}
				data-sveltekit-replacestate
				data-sveltekit-noscroll
			>
				{t('auth.tabs.register')}
			</a>
		</nav>

		{#if tab === 'register'}
			<RegisterForm
				values={form?.form === 'register' ? form.values : undefined}
				errors={form?.form === 'register' ? form.errors : undefined}
			/>
		{:else}
			<LoginForm
				values={form?.form === 'login' ? form.values : undefined}
				errors={form?.form === 'login' ? form.errors : undefined}
			/>
		{/if}
	</div>
</section>

<style>
	.login-page {
		display: grid;
		gap: var(--space-8);
		align-items: center;
	}

	.login-intro {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 34rem;
	}

	/* Il nome come intestazione stampata del libretto */
	.login-title {
		font-family: var(--font-display);
		font-optical-sizing: auto;
		font-weight: 700;
		font-size: clamp(2.75rem, 10vw + 0.5rem, var(--text-4xl));
		line-height: var(--leading-tight);
		letter-spacing: -0.015em;
		color: var(--color-ink);
	}

	.login-tagline {
		max-width: 32ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.auth-panel {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		width: 100%;
		max-width: var(--panel-max);
		padding: var(--space-5) var(--space-5) var(--space-8) var(--space-8);
	}

	.auth-tabs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-paper-edge);
	}

	.auth-tab {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 var(--space-3);
		border-radius: var(--radius-xs);
		color: var(--color-text-muted);
		font-weight: var(--weight-bold);
		font-size: var(--text-md);
		text-decoration: none;
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left center;
		background-size: 0% 70%;
	}

	.auth-tab:hover {
		color: var(--color-ink);
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	/* Scheda attiva: passata di evidenziatore */
	.auth-tab[aria-current='page'] {
		color: var(--color-on-highlight);
		background-size: 100% 70%;
		animation: highlight-swipe var(--duration-mark) var(--ease-out);
	}

	.auth-tab[aria-current='page']:hover {
		text-decoration: none;
	}

	@keyframes highlight-swipe {
		from {
			background-size: 0% 70%;
		}
		to {
			background-size: 100% 70%;
		}
	}

	@media (min-width: 30rem) {
		.auth-panel {
			padding: var(--space-6) var(--space-8) var(--space-10) var(--space-12);
		}
	}

	@media (min-width: 56rem) {
		.login-page {
			grid-template-columns: minmax(0, 1fr) minmax(0, var(--panel-max));
			gap: var(--space-16);
			min-height: 70vh;
		}

		.login-tagline {
			font-size: var(--text-lg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.auth-tab[aria-current='page'] {
			animation: none;
		}
	}
</style>
