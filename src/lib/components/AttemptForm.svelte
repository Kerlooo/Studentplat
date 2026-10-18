<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import {
		GRADE_ABSENT,
		GRADE_OPTIONS,
		NOTES_MAX,
		PASS_MIN,
		formatGrade,
		isSufficient,
		parseGradeField
	} from '#lib/grade-rules.js';
	import FormField from './FormField.svelte';

	/**
	 * Form inline per registrare l'esito di un esame del libretto nel giorno `date`:
	 * voto (1-30, 30 e lode o ritirato/assente), voto rifiutato (solo se sufficiente) e note.
	 *
	 * @type {{
	 * 	userExamId: number,
	 * 	examName: string,
	 * 	date: string,
	 * 	action: string,
	 * 	idPrefix: string,
	 * 	onsuccess: (data: Record<string, any>) => void,
	 * 	oncancel: () => void,
	 * }}
	 */
	let { userExamId, examName, date, action, idPrefix, onsuccess, oncancel } = $props();

	const t = getT();

	let grade = $state('');
	let rejected = $state(false);
	let pending = $state(false);
	/** @type {Record<string, string>} */
	let errors = $state({});
	/** @type {import('#lib/i18n/index.js').TranslateParams | undefined} */
	let errorParams = $state();

	let parsed = $derived(grade ? parseGradeField(grade) : undefined);
	let canReject = $derived(parsed !== undefined && isSufficient(parsed));

	const sufficient = GRADE_OPTIONS.filter((g) => g >= PASS_MIN);
	const insufficient = GRADE_OPTIONS.filter((g) => g < PASS_MIN);
</script>

<form
	class="attempt-form"
	method="POST"
	{action}
	novalidate
	aria-label={t('calendar.attempt.formLabel', { name: examName })}
	use:enhance={() => {
		pending = true;
		return async ({ result, update }) => {
			await update({ reset: false, navigate: false });
			pending = false;
			if (result.type === 'success' && result.data) {
				errors = {};
				onsuccess(result.data);
			} else if (result.type === 'failure') {
				const data = /** @type {Record<string, any>} */ (result.data ?? {});
				errors = data.errors ?? { general: data.error ?? 'calendar.errors.generic' };
				errorParams = data.params;
			} else if (result.type === 'error') {
				errors = { general: 'calendar.errors.generic' };
			}
		};
	}}
>
	<input type="hidden" name="date" value={date} />
	<input type="hidden" name="userExamId" value={userExamId} />

	{#if errors.general}
		<p class="form-error" role="alert">{t(errors.general, errorParams)}</p>
	{/if}

	<div class="form-field" class:has-error={!!errors.grade}>
		<label class="form-field-label" for="{idPrefix}-grade">{t('calendar.attempt.grade')}</label>
		<select
			class="form-field-input attempt-form-grade"
			id="{idPrefix}-grade"
			name="grade"
			required
			bind:value={grade}
			onchange={() => {
				if (!canReject) rejected = false;
			}}
			aria-invalid={errors.grade ? 'true' : undefined}
			aria-describedby={errors.grade ? `${idPrefix}-grade-error` : undefined}
		>
			<option value="" disabled>{t('calendar.attempt.gradePlaceholder')}</option>
			<optgroup label={t('calendar.attempt.sufficient')}>
				{#each sufficient as g (g)}
					<option value={String(g)}>{formatGrade(g, t('grades.lodeShort'))}</option>
				{/each}
			</optgroup>
			<optgroup label={t('calendar.attempt.insufficient')}>
				{#each insufficient as g (g)}
					<option value={String(g)}>{g}</option>
				{/each}
			</optgroup>
			<option value={GRADE_ABSENT}>{t('calendar.attempt.absent')}</option>
		</select>
		{#if errors.grade}
			<p class="form-field-error" id="{idPrefix}-grade-error">{t(errors.grade)}</p>
		{/if}
	</div>

	<div class="attempt-form-check" class:has-error={!!errors.rejected}>
		<input
			id="{idPrefix}-rejected"
			type="checkbox"
			name="rejected"
			bind:checked={rejected}
			disabled={!canReject}
			aria-describedby="{idPrefix}-rejected-hint"
		/>
		<label for="{idPrefix}-rejected">{t('calendar.attempt.rejected')}</label>
		<p class="form-field-hint" id="{idPrefix}-rejected-hint">
			{t('calendar.attempt.rejectedHint', { min: PASS_MIN })}
		</p>
		{#if errors.rejected}
			<p class="form-field-error">{t(errors.rejected, { min: PASS_MIN })}</p>
		{/if}
	</div>

	<FormField
		id="{idPrefix}-notes"
		name="notes"
		label={t('calendar.attempt.notes')}
		hint={t('calendar.attempt.notesHint', { max: NOTES_MAX })}
		error={errors.notes}
		errorParams={{ max: NOTES_MAX }}
		maxlength={NOTES_MAX}
		autocomplete="off"
	/>

	<div class="attempt-form-actions">
		<button class="button button-primary" type="submit" disabled={pending}>
			{t('calendar.attempt.submit')}
		</button>
		<button class="button button-secondary" type="button" onclick={oncancel}>
			{t('calendar.attempt.cancel')}
		</button>
	</div>
</form>

<style>
	/*
	 * Foglietto dentro l'etichetta d'inchiostro dell'esame (popup del giorno):
	 * carta chiara, voto scritto in Source Serif come sul libretto.
	 */
	.attempt-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		flex-basis: 100%;
		min-width: 0;
		margin: var(--space-2) 0 0;
		padding: var(--space-4);
		border: 1px solid var(--color-paper-edge);
		border-radius: var(--radius-sm);
		background: var(--color-paper);
		animation: attempt-form-in var(--duration-mark) var(--ease-out);
	}

	@keyframes attempt-form-in {
		from {
			opacity: 0;
			transform: translateY(-0.25rem);
		}
	}

	/* Stesse misure del campo di FormField (i suoi stili sono locali al componente) */
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

	.attempt-form-grade {
		width: 100%;
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-field-border);
		border-radius: var(--radius-sm);
		background: var(--color-field);
		color: var(--color-text);
		font: inherit;
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		cursor: pointer;
		transition: border-color var(--duration-fast) ease;
	}

	.attempt-form-grade:hover {
		border-color: var(--color-ink);
	}

	.attempt-form-grade:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 1px;
		border-color: var(--color-ink);
	}

	.form-field-hint {
		max-width: 60ch;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.form-field-error {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
		color: var(--color-danger);
	}

	.has-error .attempt-form-grade {
		border: 2px solid var(--color-danger);
		padding: calc(var(--space-2) - 1px) calc(var(--space-3) - 1px);
	}

	/* Voto rifiutato: casella e etichetta formano un bersaglio alto 44px */
	.attempt-form-check {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0 var(--space-3);
	}

	.attempt-form-check input {
		flex: none;
		width: 1.25rem;
		height: 1.25rem;
		margin: 0;
		accent-color: var(--color-ink);
		cursor: pointer;
	}

	.attempt-form-check input:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 2px;
	}

	.attempt-form-check label {
		display: inline-flex;
		align-items: center;
		flex: 1 1 0;
		min-width: 0;
		min-height: 2.75rem;
		font-weight: var(--weight-semibold);
		cursor: pointer;
	}

	/* Finche' non c'e' un voto sufficiente: casella spenta, etichetta attenuata */
	.attempt-form-check:has(input:disabled) input,
	.attempt-form-check:has(input:disabled) label {
		cursor: not-allowed;
	}

	.attempt-form-check:has(input:disabled) label {
		font-weight: var(--weight-regular);
		color: var(--color-text-muted);
	}

	.has-error.attempt-form-check input {
		outline: 2px solid var(--color-danger);
		outline-offset: 2px;
	}

	.attempt-form-check .form-field-hint,
	.attempt-form-check .form-field-error {
		flex-basis: 100%;
	}

	.attempt-form-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	@media (min-width: 30rem) {
		.attempt-form-grade {
			max-width: 14rem;
		}

		.attempt-form-actions {
			flex-direction: row;
			flex-wrap: wrap;
			gap: var(--space-3);
		}

		.attempt-form-actions .button {
			padding-inline: var(--space-4);
		}
	}
</style>
