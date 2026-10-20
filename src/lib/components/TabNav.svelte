<script>
	/**
	 * Schede come link (`?tab=`): funzionano anche senza JavaScript; la scheda attiva
	 * ha `aria-current="page"`. La navigazione sostituisce la voce della cronologia
	 * e non scorre la pagina.
	 *
	 * @type {{
	 * 	label: string,
	 * 	tabs: { id: string, href: string, label: string }[],
	 * 	current: string,
	 * }}
	 */
	let { label, tabs, current } = $props();
</script>

<nav class="tab-nav" aria-label={label}>
	{#each tabs as tab (tab.id)}
		<!-- eslint-disable svelte/no-navigation-without-resolve -- percorsi gia' risolti dal chiamante -->
		<a
			class="tab-nav-link"
			href={tab.href}
			aria-current={tab.id === current ? 'page' : undefined}
			data-sveltekit-replacestate
			data-sveltekit-noscroll
		>
			{tab.label}
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/each}
</nav>

<style>
	/*
	 * Stesse schede del login (.auth-tab): testo in inchiostro tenue, la scheda
	 * attiva riceve la passata di evidenziatore. La riga sotto fa da intestazione
	 * del foglio e separa le schede dal contenuto.
	 */
	.tab-nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		min-width: 0;
		padding-bottom: var(--space-3);
		border-bottom: 1px solid var(--color-paper-edge);
	}

	.tab-nav-link {
		display: inline-flex;
		align-items: center;
		max-width: 100%;
		min-height: 2.75rem;
		padding: var(--space-1) var(--space-3);
		border-radius: var(--radius-xs);
		color: var(--color-text-muted);
		font-weight: var(--weight-bold);
		font-size: var(--text-md);
		line-height: var(--leading-tight);
		overflow-wrap: anywhere;
		text-decoration: none;
		text-underline-offset: 0.2em;
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left center;
		background-size: 0% 70%;
		transition: color var(--duration-fast) ease;
	}

	.tab-nav-link:hover {
		color: var(--color-ink);
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	.tab-nav-link:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 2px;
	}

	/* Scheda attiva: passata di evidenziatore, come nel login */
	.tab-nav-link[aria-current='page'] {
		color: var(--color-on-highlight);
		background-size: 100% 70%;
		animation: tab-highlight-swipe var(--duration-mark) var(--ease-out);
	}

	.tab-nav-link[aria-current='page']:hover {
		text-decoration: none;
	}

	@keyframes tab-highlight-swipe {
		from {
			background-size: 0% 70%;
		}
		to {
			background-size: 100% 70%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tab-nav-link {
			transition: none;
		}

		.tab-nav-link[aria-current='page'] {
			animation: none;
		}
	}
</style>
