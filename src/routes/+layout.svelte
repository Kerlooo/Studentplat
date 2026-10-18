<script>
	import '../app.css';
	import { setI18n } from '#lib/i18n/context.js';
	import LanguageSwitcher from '#lib/components/LanguageSwitcher.svelte';

	/** @type {import('./$types').LayoutProps} */
	let { data, children } = $props();

	setI18n(() => data.lang);
</script>

<div class="app">
	<header class="site-header">
		<LanguageSwitcher current={data.lang} />
	</header>

	<main class="site-main">
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		min-height: 100dvh;
	}

	.site-header {
		display: flex;
		justify-content: flex-end;
		width: 100%;
		max-width: var(--content-max);
		margin-inline: auto;
		padding: var(--space-4) var(--gutter) 0;
	}

	.site-main {
		flex: 1;
		width: 100%;
		max-width: var(--content-max);
		margin-inline: auto;
		padding: var(--space-6) var(--gutter) var(--space-16);
	}
</style>
