<script>
	import { getT } from '#lib/i18n/context.js';
	import { DIFFICULTIES } from '#lib/difficulty-rules.js';

	/**
	 * Campo `difficulty` facoltativo: "Non indicata" (valore vuoto), Facile, Media, Difficile.
	 * Con `ariaLabel` l'etichetta a schermo resta breve e gli screen reader leggono quella estesa
	 * (utile negli elenchi, dove ogni riga ha il suo campo).
	 *
	 * @type {{
	 * 	id: string,
	 * 	value?: string | null,
	 * 	name?: string,
	 * 	ariaLabel?: string,
	 * 	hint?: string,
	 * 	describedby?: string,
	 * 	error?: string,
	 * 	disabled?: boolean,
	 * }}
	 */
	let {
		id,
		value = '',
		name = 'difficulty',
		ariaLabel,
		hint,
		describedby,
		error,
		disabled = false
	} = $props();

	const t = getT();

	let describedBy = $derived(
		[describedby, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') ||
			undefined
	);
</script>

<div class="difficulty-select" class:has-error={!!error}>
	<label class="difficulty-select-label" for={id}>{t('difficulty.label')}</label>
	<select
		class="difficulty-select-input"
		{id}
		{name}
		{disabled}
		value={value ?? ''}
		aria-label={ariaLabel}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
	>
		<option value="">{t('difficulty.none')}</option>
		{#each DIFFICULTIES as level (level)}
			<option value={level}>{t(`difficulty.${level}`)}</option>
		{/each}
	</select>
	{#if hint}
		<p class="difficulty-select-hint" id="{id}-hint">{hint}</p>
	{/if}
	{#if error}
		<p class="difficulty-select-error" id="{id}-error">{t(error)}</p>
	{/if}
</div>

<style>
	/* Stessa struttura di FormField: etichetta, campo, suggerimento, errore */
	.difficulty-select {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}

	.difficulty-select-label {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	/*
	 * Select disegnato come i campi di FormField, con la freccia in inchiostro.
	 * Il livello scelto compare come fascia di 4px a sinistra, la stessa
	 * delle etichette d'esame nel calendario (segue la scelta anche senza JavaScript).
	 */
	.difficulty-select-input {
		--chevron: var(--color-ink);

		width: 100%;
		min-height: 2.75rem;
		padding: var(--space-2) calc(var(--space-3) + 1.25rem) var(--space-2) calc(var(--space-3) + 4px);
		border: 1px solid var(--color-field-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-field);
		background-image:
			linear-gradient(45deg, transparent 50%, var(--chevron) 50%),
			linear-gradient(135deg, var(--chevron) 50%, transparent 50%);
		background-position:
			right calc(var(--space-3) + 5px) center,
			right var(--space-3) center;
		background-size: 5px 5px;
		background-repeat: no-repeat;
		box-shadow: inset 4px 0 0 var(--difficulty-color, transparent);
		color: var(--color-text);
		font: inherit;
		line-height: var(--leading-snug);
		appearance: none;
		cursor: pointer;
		transition:
			border-color var(--duration-fast) ease,
			box-shadow var(--duration-fast) ease;
	}

	.difficulty-select-input:has(option[value='easy']:checked) {
		--difficulty-color: var(--color-difficulty-easy);
	}

	.difficulty-select-input:has(option[value='medium']:checked) {
		--difficulty-color: var(--color-difficulty-medium);
	}

	.difficulty-select-input:has(option[value='hard']:checked) {
		--difficulty-color: var(--color-difficulty-hard);
	}

	.difficulty-select-input:hover:not(:disabled) {
		border-color: var(--color-ink);
	}

	.difficulty-select-input:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 1px;
		border-color: var(--color-ink);
	}

	.difficulty-select-input:disabled {
		--chevron: var(--color-text-muted);
		opacity: 0.65;
		cursor: progress;
	}

	.difficulty-select-hint {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	/* Bordo di 2px senza far crescere il campo (come FormField) */
	.has-error .difficulty-select-input {
		border-width: 2px;
		border-color: var(--color-danger);
		padding-block: calc(var(--space-2) - 1px);
		padding-inline-start: calc(var(--space-3) + 3px);
		padding-inline-end: calc(var(--space-3) + 1.25rem - 1px);
	}

	/* Contrasto elevato: select nativo (la freccia disegnata sparirebbe) */
	@media (forced-colors: active) {
		.difficulty-select-input {
			padding-inline: var(--space-3);
			appearance: auto;
		}
	}

	.difficulty-select-error {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-danger);
	}
</style>
