<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import {
		EXAM_CFU_MAX,
		EXAM_CFU_MIN,
		EXAM_NAME_MAX,
		examSearchKey,
		normalizeExamName
	} from '#lib/exam-rules.js';
	import FormField from './FormField.svelte';

	/**
	 * Form per creare un esame nel catalogo condiviso e fissarlo nel giorno `date`.
	 * Prima dell'invio segnala gli esami con lo stesso nome gia' presenti.
	 *
	 * @type {{
	 * 	date: string,
	 * 	action: string,
	 * 	catalog: { id: number, name: string, cfu: number }[],
	 * 	initialName?: string,
	 * 	onsuccess: (data: Record<string, any>) => void,
	 * 	oncancel: () => void,
	 * }}
	 */
	let { date, action, catalog, initialName = '', onsuccess, oncancel } = $props();

	const t = getT();
	const cfuRange = { min: EXAM_CFU_MIN, max: EXAM_CFU_MAX };

	// Valore iniziale copiato una volta sola (il testo cercato): poi lo gestisce il form
	// svelte-ignore state_referenced_locally
	let name = $state(initialName);
	let cfu = $state('');
	let pending = $state(false);
	/** @type {Record<string, string>} */
	let errors = $state({});
	/** @type {import('#lib/i18n/index.js').TranslateParams | undefined} */
	let errorParams = $state();

	// Esami del catalogo con lo stesso nome (maiuscole, accenti e spazi non contano)
	let sameName = $derived.by(() => {
		const key = examSearchKey(name);
		return key ? catalog.filter((exam) => examSearchKey(exam.name) === key) : [];
	});
	let exact = $derived(sameName.find((exam) => String(exam.cfu) === cfu.trim()));
	let otherCfus = $derived(sameName.filter((exam) => exam !== exact).map((exam) => exam.cfu));
</script>

<form
	class="create-exam-form"
	method="POST"
	{action}
	novalidate
	use:enhance={() => {
		pending = true;
		return async ({ result, update }) => {
			await update({ reset: false, navigate: false });
			pending = false;
			if (result.type === 'success' && result.data) {
				errors = {};
				onsuccess(result.data);
			} else if (result.type === 'failure') {
				const data =
					/** @type {{ errors?: Record<string, string>, error?: string, params?: import('#lib/i18n/index.js').TranslateParams }} */ (
						result.data ?? {}
					);
				errors = data.errors ?? { general: data.error ?? 'calendar.errors.generic' };
				errorParams = data.params;
			} else if (result.type === 'error') {
				errors = { general: 'calendar.errors.generic' };
			}
		};
	}}
>
	<input type="hidden" name="date" value={date} />

	{#if errors.general}
		<p class="form-error" role="alert">{t(errors.general, errorParams)}</p>
	{/if}

	<FormField
		id="create-exam-name"
		name="name"
		label={t('calendar.create.name')}
		value={name}
		oninput={(/** @type {Event & { currentTarget: HTMLInputElement }} */ e) =>
			(name = e.currentTarget.value)}
		onblur={() => (name = normalizeExamName(name))}
		error={errors.name}
		errorParams={{ max: EXAM_NAME_MAX }}
		autocomplete="off"
		maxlength={EXAM_NAME_MAX}
		required
	/>
	<FormField
		id="create-exam-cfu"
		name="cfu"
		type="number"
		inputmode="numeric"
		label={t('calendar.create.cfu')}
		hint={t('calendar.create.cfuHint', cfuRange)}
		value={cfu}
		oninput={(/** @type {Event & { currentTarget: HTMLInputElement }} */ e) =>
			(cfu = e.currentTarget.value)}
		error={errors.cfu}
		errorParams={cfuRange}
		min={EXAM_CFU_MIN}
		max={EXAM_CFU_MAX}
		step="1"
		required
	/>

	<!-- Avviso sui doppioni, letto dagli screen reader mentre si scrive -->
	<p class="create-exam-match" role="status">
		{#if exact}
			{t('calendar.create.existsSame', { cfu: exact.cfu })}
		{:else if otherCfus.length > 0}
			{t('calendar.create.existsOther', { cfu: otherCfus.join(', ') })}
		{/if}
	</p>

	<div class="create-exam-actions">
		<button class="button button-primary" type="submit" disabled={pending}>
			{t('calendar.create.submit')}
		</button>
		<button class="button button-secondary" type="button" onclick={oncancel}>
			{t('calendar.create.cancel')}
		</button>
	</div>
</form>

<style>
	/*
	 * Riquadro di creazione: una scheda bianca appoggiata sulla pagina,
	 * con il filetto d'inchiostro a sinistra come le etichette d'esame.
	 */
	.create-exam-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		margin-top: var(--space-1);
		padding: var(--space-4);
		border: 1px solid var(--color-paper-edge);
		border-left: 3px solid var(--color-ink);
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
		background: var(--color-field);
	}

	/* Avviso sui doppioni: passata di evidenziatore. Vuoto, non occupa spazio */
	.create-exam-match {
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--color-highlight);
		border-radius: var(--radius-xs);
		background: color-mix(in srgb, var(--color-highlight) 30%, var(--color-paper));
		color: var(--color-text);
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.create-exam-match:empty {
		/* Resta nel DOM come regione live, ma senza ingombro */
		padding: 0;
		border: 0;
		margin-top: calc(-1 * var(--space-4));
	}

	.create-exam-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	.create-exam-actions .button {
		flex: 1 1 auto;
	}

	@media (min-width: 30rem) {
		.create-exam-actions .button {
			flex: 0 0 auto;
		}
	}
</style>
