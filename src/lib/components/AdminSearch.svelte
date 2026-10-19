<script>
	import { getT } from '#lib/i18n/context.js';
	import { ADMIN_SEARCH_MAX } from '#lib/admin-rules.js';

	/**
	 * Ricerca di un elenco del pannello: form GET su `q`, una nuova ricerca riparte dalla prima pagina.
	 * Con `value` non vuoto compare il link per azzerarla.
	 *
	 * @type {{ id: string, action: string, label: string, value: string }}
	 */
	let { id, action, label, value } = $props();

	const t = getT();
</script>

<form class="admin-search" method="GET" {action} role="search">
	<label class="admin-search-label" for={id}>{label}</label>
	<div class="admin-search-row">
		<input
			class="admin-search-input"
			{id}
			name="q"
			type="search"
			{value}
			maxlength={ADMIN_SEARCH_MAX}
			autocomplete="off"
		/>
		<button class="button button-secondary" type="submit">{t('admin.search.submit')}</button>
		{#if value}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- percorso gia' risolto dal chiamante -->
			<a class="admin-search-clear" href={action}>{t('admin.search.clear')}</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</div>
</form>

<style>
	.admin-search {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		max-width: 36rem;
		margin: 0;
	}

	.admin-search-label {
		font-weight: var(--weight-semibold);
	}

	.admin-search-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
	}

	/* Stesso campo di FormField: bordo che passa all'inchiostro, anello di focus evidente */
	.admin-search-input {
		flex: 1 1 14rem;
		min-width: 0;
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-field-border);
		border-radius: var(--radius-sm);
		background: var(--color-field);
		color: var(--color-text);
		font-size: var(--text-base);
		appearance: none;
		transition: border-color var(--duration-fast) ease;
	}

	.admin-search-input:hover {
		border-color: var(--color-ink);
	}

	.admin-search-input:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 1px;
		border-color: var(--color-ink);
	}

	/* Pulsante grande quanto il campo, sulla stessa riga quando c'e' spazio */
	.admin-search-row > .button {
		flex: none;
	}

	.admin-search-clear {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		font-weight: var(--weight-semibold);
		color: var(--color-ink);
		text-decoration-thickness: 1px;
	}

	.admin-search-clear:hover {
		color: var(--color-ink-strong);
		text-decoration-thickness: 2px;
	}
</style>
