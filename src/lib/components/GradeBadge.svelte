<script>
	import { getT } from '#lib/i18n/context.js';
	import { attemptOutcome, formatGrade } from '#lib/grade-rules.js';

	/**
	 * Voto di un tentativo in forma breve ("28", "30L", "Rit.") con la classe dell'esito
	 * (`is-passed`, `is-failed`, `is-rejected`, `is-withdrawn`).
	 * Gli screen reader leggono il voto per esteso con l'esito ("30 e lode, superato").
	 * Con `withOutcome` l'esito e' scritto anche a schermo ("28 Superato").
	 *
	 * @type {{ grade: number | null, rejected?: boolean, withOutcome?: boolean }}
	 */
	let { grade, rejected = false, withOutcome = false } = $props();

	const t = getT();

	let outcome = $derived(attemptOutcome({ grade, rejected }));
	let short = $derived(formatGrade(grade, t('grades.lodeShort')));
	let long = $derived(formatGrade(grade, t('grades.lode')) ?? '');
</script>

<span class="grade-badge is-{outcome}">
	{#if withOutcome}
		{#if short !== null}<span class="grade-badge-value" aria-hidden="true">{short}</span>
			<span class="visually-hidden">{long}</span>{/if}
		<span class="grade-badge-outcome">{t(`grades.outcome.${outcome}`)}</span>
	{:else}
		<span class="grade-badge-value" aria-hidden="true">{short ?? t('grades.withdrawnShort')}</span>
		<span class="visually-hidden">{t(`grades.outcomeLong.${outcome}`, { grade: long })}</span>
	{/if}
</span>

<style>
	/*
	 * Il voto come si scrive sul libretto. Ogni esito ha una forma propria,
	 * non solo un colore:
	 * - superato: voto nella casella, bordo pieno d'inchiostro;
	 * - non superato: voto cerchiato in rosso, come una correzione;
	 * - rifiutato: voto barrato dentro una casella tratteggiata;
	 * - ritirato o assente: "Rit." in corsivo, senza casella.
	 * Misure in em: il badge segue la dimensione del contesto (calendario, libretto, popup).
	 */
	.grade-badge {
		display: inline-flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) var(--space-2);
		line-height: var(--leading-tight);
	}

	.grade-badge-value {
		display: inline-block;
		min-width: 2.25em;
		padding: 0.15em 0.35em 0.1em;
		border: 2px solid transparent;
		border-radius: var(--radius-xs);
		font-family: var(--font-display);
		font-size: 1.125em;
		font-weight: var(--weight-bold);
		font-variant-numeric: lining-nums tabular-nums;
		line-height: var(--leading-tight);
		text-align: center;
		white-space: nowrap;
	}

	.grade-badge-outcome {
		font-size: var(--text-sm);
		font-weight: var(--weight-semibold);
	}

	.is-passed .grade-badge-value {
		border-color: var(--color-ink);
		background: var(--color-ink-soft);
		color: var(--color-ink-strong);
	}

	.is-passed .grade-badge-outcome {
		color: var(--color-ink);
	}

	.is-failed .grade-badge-value {
		border-color: var(--color-danger);
		border-radius: var(--radius-pill);
		background: var(--color-danger-soft);
		color: var(--color-danger);
	}

	.is-failed .grade-badge-outcome {
		color: var(--color-danger);
	}

	.is-rejected .grade-badge-value {
		border-style: dashed;
		border-color: var(--color-text-muted);
		color: var(--color-text-muted);
		text-decoration: line-through;
		text-decoration-thickness: 2px;
	}

	.is-rejected .grade-badge-outcome {
		color: var(--color-text-muted);
	}

	.is-withdrawn .grade-badge-value,
	.is-withdrawn .grade-badge-outcome {
		font-style: italic;
		font-weight: var(--weight-semibold);
		color: var(--color-text-muted);
	}

	.is-withdrawn .grade-badge-value {
		min-width: 0;
		padding-inline: 0.15em;
	}
</style>
