<script>
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import { IMPORT_EXAMPLE, IMPORT_MAX_BYTES, IMPORT_MAX_ITEMS } from '#lib/import-rules.js';
	import { EXAM_CFU_MAX, EXAM_CFU_MIN, EXAM_NAME_MAX } from '#lib/exam-rules.js';
	import { NOTES_MAX, TEACHER_MAX } from '#lib/grade-rules.js';

	/**
	 * Importazione degli esami sostenuti da un elenco JSON (action `?/import` del profilo).
	 * In caso di errori non viene salvato nulla: il testo resta nel campo e sotto
	 * compare l'elenco degli errori per riga (riga 0 = errore sull'intero testo).
	 *
	 * @type {{
	 * 	initialText?: string,
	 * 	errors?: { row: number, key: string, params?: import('#lib/i18n/index.js').TranslateParams }[],
	 * 	result?: { attempts: number, newExams: number, duplicates: number } | null,
	 * }}
	 */
	let { initialText = '', errors = [], result = null } = $props();

	const t = getT();
	const limits = { items: IMPORT_MAX_ITEMS, size: IMPORT_MAX_BYTES / 1024 };
	const fieldParams = {
		nameMax: EXAM_NAME_MAX,
		cfuMin: EXAM_CFU_MIN,
		cfuMax: EXAM_CFU_MAX,
		teacherMax: TEACHER_MAX,
		notesMax: NOTES_MAX
	};

	// Testo copiato una volta dal server (invio senza JavaScript), poi lo gestisce il campo
	// svelte-ignore state_referenced_locally
	let text = $state(initialText);
	let pending = $state(false);
	let canCopy = $state(false);
	let copied = $state(false);

	// Il pulsante "Copia" compare solo nel browser e se gli appunti sono disponibili
	onMount(() => {
		canCopy = !!navigator.clipboard;
	});

	async function copyExample() {
		try {
			await navigator.clipboard.writeText(IMPORT_EXAMPLE);
			copied = true;
		} catch {
			copied = false;
		}
	}

	/** @param {{ row: number, key: string, params?: import('#lib/i18n/index.js').TranslateParams }} error */
	const describe = (error) => {
		const message = t(error.key, error.params);
		return error.row > 0 ? t('import.errors.row', { row: error.row, message }) : message;
	};

	const fields = /** @type {const} */ ([
		'name',
		'cfu',
		'date',
		'grade',
		'rejected',
		'teacher',
		'notes'
	]);
</script>

<section class="exam-import" id="exam-import" aria-labelledby="exam-import-title">
	<h2 class="exam-import-title" id="exam-import-title">{t('import.title')}</h2>
	<p class="exam-import-intro">{t('import.intro', limits)}</p>

	<dl class="exam-import-fields">
		{#each fields as field (field)}
			<div class="exam-import-field">
				<dt><code>{field}</code></dt>
				<dd>{t(`import.fields.${field}`, fieldParams)}</dd>
			</div>
		{/each}
	</dl>

	<figure class="exam-import-example">
		<figcaption class="exam-import-example-caption">{t('import.example')}</figcaption>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<pre class="exam-import-example-code" tabindex="0"><code>{IMPORT_EXAMPLE}</code></pre>
		{#if canCopy}
			<div class="exam-import-copy">
				<button class="button button-secondary" type="button" onclick={copyExample}>
					{t('import.copy')}
				</button>
				<span role="status">{copied ? t('import.copied') : ''}</span>
			</div>
		{/if}
	</figure>

	<form
		class="exam-import-form"
		method="POST"
		action="?/import"
		use:enhance={() => {
			pending = true;
			copied = false;
			return async ({ result: res, update }) => {
				await update({ reset: false });
				pending = false;
				if (res.type === 'success') text = '';
			};
		}}
	>
		<div class="exam-import-input">
			<label class="exam-import-label" for="exam-import-json">{t('import.label')}</label>
			<textarea
				class="exam-import-textarea"
				id="exam-import-json"
				name="json"
				rows="12"
				spellcheck="false"
				autocomplete="off"
				aria-invalid={errors.length > 0 ? 'true' : undefined}
				aria-describedby={errors.length > 0 ? 'exam-import-errors' : undefined}
				bind:value={text}></textarea>
		</div>

		{#if errors.length > 0 && !pending}
			<div class="exam-import-errors form-error" id="exam-import-errors" role="alert">
				<p>{t('import.errors.title', { count: errors.length })}</p>
				<ul class="exam-import-error-list">
					{#each errors as error, i (i)}
						<li>{describe(error)}</li>
					{/each}
				</ul>
			</div>
		{/if}

		<div class="exam-import-actions">
			<button class="button button-primary" type="submit" disabled={pending || !text.trim()}>
				{t('import.submit')}
			</button>
			<p class="exam-import-status" role="status">
				{#if result && !pending}{t('import.success', result)}{/if}
			</p>
		</div>
	</form>
</section>

<style>
	/*
	 * Istruzioni d'importazione: elenco dei campi come un glossario,
	 * esempio in un riquadro di codice che scorre da solo in orizzontale
	 * (la pagina no), campo monospazio che va a capo.
	 */
	.exam-import,
	.exam-import-form,
	.exam-import-input {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.exam-import {
		gap: var(--space-5);
		/* Arrivando da /dashboard/exams con #exam-import il titolo non resta attaccato al bordo */
		scroll-margin-top: var(--space-8);
	}

	.exam-import-form {
		gap: var(--space-4);
	}

	.exam-import-input {
		gap: var(--space-1);
	}

	.exam-import-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		color: var(--color-text);
	}

	.exam-import-intro {
		max-width: 60ch;
		color: var(--color-text-muted);
	}

	.exam-import-label {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	/* Campi: nome del campo in un'etichetta di codice, descrizione accanto o sotto */
	.exam-import-fields {
		display: flex;
		flex-direction: column;
		margin: 0;
		border-block: 1px solid var(--color-rule);
	}

	.exam-import-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		padding-block: var(--space-2);
		min-width: 0;
	}

	.exam-import-field + .exam-import-field {
		border-top: 1px solid var(--color-rule);
	}

	.exam-import-field dt code {
		display: inline-block;
		padding: 0 var(--space-2);
		border-radius: var(--radius-xs);
		background: var(--color-ink-soft);
		color: var(--color-ink-strong);
		font-weight: var(--weight-semibold);
	}

	.exam-import-field dd {
		margin: 0;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.exam-import-example {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		min-width: 0;
	}

	.exam-import-example-caption {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.exam-import-example-code {
		max-width: 100%;
		margin: 0;
		padding: var(--space-3) var(--space-4);
		overflow-x: auto;
		overscroll-behavior-x: contain;
		border: 1px solid var(--color-paper-edge);
		border-left: 4px solid var(--color-ink);
		border-radius: var(--radius-xs);
		background: color-mix(in srgb, var(--color-ink-soft) 40%, var(--color-paper));
		color: var(--color-text);
		font-size: var(--text-sm);
		line-height: var(--leading-body);
		tab-size: 2;
	}

	/* Il riquadro scorrevole si raggiunge da tastiera solo se il browser lo rende focalizzabile */
	.exam-import-example-code:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 2px;
	}

	.exam-import-example-code code {
		font-size: inherit;
	}

	.exam-import-textarea {
		width: 100%;
		max-width: 100%;
		min-height: 12rem;
		padding: var(--space-3);
		border: 1px solid var(--color-field-border);
		border-radius: var(--radius-sm);
		background: var(--color-field);
		color: var(--color-text);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		line-height: var(--leading-body);
		tab-size: 2;
		overflow-wrap: anywhere;
		resize: vertical;
		transition: border-color var(--duration-fast) ease;
	}

	.exam-import-textarea:hover {
		border-color: var(--color-ink);
	}

	.exam-import-textarea:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 1px;
		border-color: var(--color-ink);
	}

	.exam-import-textarea[aria-invalid='true'] {
		border: 2px solid var(--color-danger);
		padding: calc(var(--space-3) - 1px);
	}

	/* Errori per riga: dentro il riquadro .form-error globale, testo normale e cifre tabellari */
	.exam-import-errors {
		min-width: 0;
	}

	.exam-import-error-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		margin: var(--space-2) 0 0;
		padding-inline-start: var(--space-5);
		font-weight: var(--weight-regular);
		color: var(--color-text);
		overflow-wrap: anywhere;
	}

	.exam-import-error-list li::marker {
		color: var(--color-danger);
	}

	.exam-import-copy,
	.exam-import-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
	}

	.exam-import-copy .button {
		padding-inline: var(--space-4);
	}

	.exam-import-copy [role='status'] {
		font-weight: var(--weight-semibold);
		color: var(--color-ink);
	}

	/* Esito: nota a margine in inchiostro, come i messaggi del calendario */
	.exam-import-status:not(:empty) {
		flex-basis: 100%;
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--color-ink);
		border-radius: var(--radius-xs);
		background: var(--color-ink-soft);
		color: var(--color-text);
		font-weight: var(--weight-semibold);
	}

	.exam-import-actions .button {
		width: 100%;
	}

	@media (min-width: 30rem) {
		.exam-import-field {
			display: grid;
			grid-template-columns: 6.5rem minmax(0, 1fr);
			align-items: baseline;
			gap: var(--space-3);
		}

		.exam-import-actions .button {
			width: auto;
		}
	}
</style>
