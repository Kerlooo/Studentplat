<script>
	import AdminNav from '#lib/components/AdminNav.svelte';

	/** @type {import('./$types').LayoutProps} */
	let { children } = $props();
</script>

<div class="admin-area">
	<AdminNav />
	<div class="admin-content">
		{@render children()}
	</div>
</div>

<style>
	/*
	 * Stessa impaginazione dell'area riservata: indice in alto su mobile, a sinistra da 56rem.
	 *
	 * Segno dell'area admin: il quaderno dello studente ha il margine rosso, il registro
	 * della segreteria lo ha in inchiostro blu. Ridefinire --color-margin qui basta perche'
	 * indice, fogli e tabelle del pannello lo ereditino, in tema chiaro e scuro.
	 */
	.admin-area {
		--color-margin: color-mix(in srgb, var(--color-ink) 55%, var(--color-paper));

		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.admin-content {
		min-width: 0;
	}

	@media (min-width: 56rem) {
		.admin-area {
			display: grid;
			grid-template-columns: 12rem minmax(0, 1fr);
			align-items: start;
			gap: var(--space-12);
		}

		.admin-content {
			padding-top: var(--space-2);
		}
	}
</style>
