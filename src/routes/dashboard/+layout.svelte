<script>
	import DashboardNav from '#lib/components/DashboardNav.svelte';

	/** @type {import('./$types').LayoutProps} */
	let { data, children } = $props();
</script>

<div class="dashboard-area">
	<DashboardNav isAdmin={data.role === 'admin'} />
	<div class="dashboard-content">
		{@render children()}
	</div>
</div>

<style>
	/*
	 * Mobile: indice in alto, contenuto sotto.
	 * Desktop: indice laterale a sinistra del margine rosso, come la colonna
	 * delle voci in un libretto; il contenuto e' la pagina a destra.
	 */
	.dashboard-area {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.dashboard-content {
		min-width: 0;
	}

	@media (min-width: 56rem) {
		.dashboard-area {
			display: grid;
			grid-template-columns: 12rem minmax(0, 1fr);
			align-items: start;
			gap: var(--space-12);
		}

		.dashboard-content {
			padding-top: var(--space-2);
		}
	}
</style>
