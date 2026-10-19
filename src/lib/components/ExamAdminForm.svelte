<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import { EXAM_CFU_MAX, EXAM_CFU_MIN, EXAM_NAME_MAX } from '#lib/exam-rules.js';
	import FormField from './FormField.svelte';

	/**
	 * Modifica di nome e CFU di un esame del catalogo. Se la coppia esiste gia'
	 * l'errore sul nome rimanda all'unione (`duplicate` arriva dal server).
	 *
	 * @type {{
	 * 	values: { name: string, cfu: string },
	 * 	errors?: Record<string, string>,
	 * 	duplicate?: { id: number, name: string, cfu: number } | null,
	 * 	saved?: boolean,
	 * }}
	 */
	let { values, errors = {}, duplicate = null, saved = false } = $props();

	const t = getT();
	let pending = $state(false);

	/** @type {import('#lib/i18n/index.js').TranslateParams} */
	const lengthParams = { max: EXAM_NAME_MAX };
	let nameParams = $derived(
		duplicate ? { name: duplicate.name, cfu: duplicate.cfu } : lengthParams
	);
</script>

<form
	class="exam-admin-form"
	method="POST"
	action="?/edit"
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			await update({ reset: false });
			pending = false;
		};
	}}
>
	{#if errors.general}
		<p class="form-error" role="alert">{t(errors.general)}</p>
	{/if}

	<FormField
		id="exam-admin-name"
		name="name"
		label={t('admin.exam.edit.name')}
		value={values.name}
		error={errors.name}
		errorParams={nameParams}
		maxlength={EXAM_NAME_MAX}
		required
		autocomplete="off"
	/>
	<FormField
		id="exam-admin-cfu"
		name="cfu"
		type="number"
		label={t('admin.exam.edit.cfu')}
		value={values.cfu}
		error={errors.cfu}
		errorParams={{ min: EXAM_CFU_MIN, max: EXAM_CFU_MAX }}
		min={EXAM_CFU_MIN}
		max={EXAM_CFU_MAX}
		step="1"
		inputmode="numeric"
		required
	/>

	{#if duplicate}
		<p class="exam-admin-form-hint">{t('admin.exam.edit.mergeHint')}</p>
	{/if}

	<div class="exam-admin-form-actions">
		<button class="button button-primary" type="submit" disabled={pending}>
			{t('admin.exam.edit.submit')}
		</button>
		<p class="exam-admin-form-status" role="status">
			{#if saved && !pending}{t('admin.exam.edit.saved')}{/if}
		</p>
	</div>
</form>

<style>
	.exam-admin-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		max-width: 28rem;
		margin: 0;
	}

	.exam-admin-form-hint {
		max-width: 60ch;
		color: var(--color-text-muted);
	}

	.exam-admin-form-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
	}

	.exam-admin-form-status {
		font-weight: var(--weight-semibold);
		color: var(--color-ink);
	}

	/* Salvato: passata di evidenziatore, come l'ultimo esame toccato nel libretto */
	.exam-admin-form-status:not(:empty) {
		padding-inline: var(--space-1);
		color: var(--color-on-highlight);
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left 60%;
		background-size: 100% 70%;
		animation: saved-swipe var(--duration-mark) var(--ease-out);
	}

	@keyframes saved-swipe {
		from {
			background-size: 0% 70%;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.exam-admin-form-status:not(:empty) {
			animation: none;
		}
	}
</style>
