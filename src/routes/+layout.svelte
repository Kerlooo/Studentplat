<script>
	import '../app.css';
	import { setI18n } from '#lib/i18n/context.js';
	import SiteHeader from '#lib/components/SiteHeader.svelte';

	/** @type {import('./$types').LayoutProps} */
	let { data, children } = $props();

	setI18n(() => data.lang);
</script>

<div class="app">
	<SiteHeader lang={data.lang} isGuest={!data.user} />

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

	.site-main {
		flex: 1;
		width: 100%;
		max-width: var(--content-max);
		margin-inline: auto;
		padding: var(--space-6) var(--gutter) var(--space-16);
	}
</style>
