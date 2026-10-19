<script>
	import { getT } from '#lib/i18n/context.js';

	/**
	 * Navigazione tra le pagine di un elenco: precedente, posizione, successiva.
	 * Con una sola pagina non mostra nulla.
	 *
	 * @type {{ page: number, pages: number, hrefFor: (page: number) => string, label: string }}
	 */
	let { page, pages, hrefFor, label } = $props();

	const t = getT();
</script>

{#if pages > 1}
	<nav class="pagination" aria-label={label}>
		<!-- eslint-disable svelte/no-navigation-without-resolve -- percorsi gia' risolti dal chiamante -->
		{#if page > 1}
			<a class="pagination-link" href={hrefFor(page - 1)} rel="prev">{t('admin.pagination.prev')}</a
			>
		{/if}
		<p class="pagination-position">{t('admin.pagination.position', { page, pages })}</p>
		{#if page < pages}
			<a class="pagination-link" href={hrefFor(page + 1)} rel="next">{t('admin.pagination.next')}</a
			>
		{/if}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</nav>
{/if}

<style>
	/*
	 * Piede di pagina del registro: precedente a sinistra, posizione al centro,
	 * successiva a destra. Le colonne restano fisse anche quando manca uno dei link,
	 * cosi' la posizione non salta tra la prima e l'ultima pagina.
	 * Sotto 30rem i link vanno su una riga e la posizione sotto.
	 */
	.pagination {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		grid-template-areas:
			'prev next'
			'pos  pos';
		align-items: center;
		gap: var(--space-1) var(--space-4);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-paper-edge);
	}

	.pagination-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2.75rem;
		font-weight: var(--weight-bold);
		color: var(--color-ink);
		text-decoration-thickness: 1px;
	}

	.pagination-link:hover {
		color: var(--color-ink-strong);
		text-decoration-thickness: 2px;
	}

	/* Frecce disegnate, fuori dal testo tradotto */
	.pagination-link::before,
	.pagination-link::after {
		flex: none;
		width: 0.45rem;
		height: 0.45rem;
		border-bottom: 2px solid currentColor;
	}

	.pagination-link[rel='prev'] {
		grid-area: prev;
		justify-self: start;
	}

	.pagination-link[rel='prev']::before {
		content: '';
		border-left: 2px solid currentColor;
		transform: rotate(45deg);
	}

	.pagination-link[rel='next'] {
		grid-area: next;
		justify-self: end;
		text-align: end;
	}

	.pagination-link[rel='next']::after {
		content: '';
		border-right: 2px solid currentColor;
		transform: rotate(-45deg);
	}

	.pagination-position {
		grid-area: pos;
		justify-self: center;
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
		font-variant-numeric: lining-nums tabular-nums;
	}

	@media (min-width: 30rem) {
		.pagination {
			grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
			grid-template-areas: 'prev pos next';
		}
	}
</style>
