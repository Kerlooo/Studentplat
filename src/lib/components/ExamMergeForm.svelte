<script>
	import { getNumberFormat, getT } from '#lib/i18n/context.js';
	import ConfirmDangerForm from './ConfirmDangerForm.svelte';

	/**
	 * Unione dell'esame corrente in un altro esame del catalogo, scelto dall'elenco.
	 * La conferma riassume cosa succede; il server blocca l'unione se uno studente
	 * ha superato entrambi gli esami.
	 *
	 * @type {{
	 * 	exam: { name: string, cfu: number, userExams: number, attempts: number },
	 * 	others: { id: number, name: string, cfu: number }[],
	 * 	selected?: number | null,
	 * 	confirming?: boolean,
	 * 	cancelHref: string,
	 * }}
	 */
	let { exam, others, selected = null, confirming = false, cancelHref } = $props();

	const t = getT();
	const number = getNumberFormat();

	// Destinazione: quella indicata dal server (conferma, errore, doppione), poi la sceglie l'admin
	let targetId = $derived(selected === null ? '' : String(selected));
	let target = $derived(others.find((other) => String(other.id) === targetId));

	/** @param {{ name: string, cfu: number }} item */
	const examLabel = (item) => t('admin.exam.option', { name: item.name, cfu: item.cfu });

	let details = $derived([
		t('admin.exam.merge.detailUserExams', { count: number(exam.userExams) }),
		t('admin.exam.merge.detailAttempts', { count: number(exam.attempts) }),
		t('admin.exam.merge.detailDelete', { name: examLabel(exam) }),
		t('admin.exam.merge.detailConflict')
	]);
</script>

{#if others.length === 0}
	<p class="exam-merge-empty">{t('admin.exam.merge.none')}</p>
{:else}
	<ConfirmDangerForm
		action="?/merge"
		label={t('admin.exam.merge.submit')}
		question={target
			? t('admin.exam.merge.question', { source: examLabel(exam), target: examLabel(target) })
			: t('admin.exam.merge.questionNoTarget')}
		{details}
		confirmLabel={t('admin.exam.merge.confirm')}
		cancelLabel={t('admin.confirm.cancel')}
		{cancelHref}
		{confirming}
	>
		{#snippet fields()}
			<div class="exam-merge-field">
				<label class="exam-merge-label" for="exam-merge-target"
					>{t('admin.exam.merge.target')}</label
				>
				<select
					class="exam-merge-select"
					id="exam-merge-target"
					name="targetId"
					required
					bind:value={targetId}
				>
					<option value="" disabled>{t('admin.exam.merge.choose')}</option>
					{#each others as other (other.id)}
						<option value={String(other.id)}>{examLabel(other)}</option>
					{/each}
				</select>
			</div>
		{/snippet}
	</ConfirmDangerForm>
{/if}

<style>
	.exam-merge-empty {
		max-width: 60ch;
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
	}

	.exam-merge-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		max-width: 28rem;
	}

	.exam-merge-label {
		font-weight: var(--weight-semibold);
	}

	/* Stesso campo di FormField; i nomi lunghi non allargano la pagina su smartphone */
	.exam-merge-select {
		width: 100%;
		max-width: 100%;
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-field-border);
		border-radius: var(--radius-sm);
		background-color: var(--color-field);
		color: var(--color-text);
		font-size: var(--text-base);
		text-overflow: ellipsis;
		cursor: pointer;
		transition: border-color var(--duration-fast) ease;
	}

	.exam-merge-select:hover {
		border-color: var(--color-ink);
	}

	.exam-merge-select:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 1px;
		border-color: var(--color-ink);
	}
</style>
