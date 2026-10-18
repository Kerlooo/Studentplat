<script>
	import { getT } from '#lib/i18n/context.js';

	/**
	 * @type {{
	 * 	id: string,
	 * 	name: string,
	 * 	label: string,
	 * 	type?: string,
	 * 	value?: string,
	 * 	error?: string,
	 * 	errorParams?: import('#lib/i18n/index.js').TranslateParams,
	 * 	hint?: string,
	 * } & import('svelte/elements').HTMLInputAttributes}
	 */
	let { id, name, label, type = 'text', value = '', error, errorParams, hint, ...rest } = $props();

	const t = getT();

	let describedBy = $derived(
		[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
	);
</script>

<div class="form-field" class:has-error={!!error}>
	<label class="form-field-label" for={id}>{label}</label>
	<input
		class="form-field-input"
		{id}
		{name}
		{type}
		{value}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={describedBy}
		{...rest}
	/>
	{#if hint}
		<p class="form-field-hint" id="{id}-hint">{hint}</p>
	{/if}
	{#if error}
		<p class="form-field-error" id="{id}-error">{t(error, errorParams)}</p>
	{/if}
</div>

<style>
	.form-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
	}

	.form-field-label {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.form-field-input {
		width: 100%;
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-field-border);
		border-radius: var(--radius-sm);
		background: var(--color-field);
		color: var(--color-text);
		font-size: var(--text-base);
		transition:
			border-color var(--duration-fast) ease,
			box-shadow var(--duration-fast) ease;
	}

	.form-field-input:hover {
		border-color: var(--color-ink);
	}

	/* Focus: bordo e anello in inchiostro, ben visibile anche da tastiera */
	.form-field-input:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 1px;
		border-color: var(--color-ink);
	}

	.form-field-hint {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.has-error .form-field-input {
		border-color: var(--color-danger);
		border-width: 2px;
		padding: calc(var(--space-2) - 1px) calc(var(--space-3) - 1px);
	}

	.form-field-error {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-danger);
	}
</style>
