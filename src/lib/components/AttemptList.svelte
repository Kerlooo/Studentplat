<script>
	import { enhance } from '$app/forms';
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { isoToUtcDate } from '#lib/calendar.js';
	import { attemptOutcome } from '#lib/grade-rules.js';
	import GradeBadge from './GradeBadge.svelte';

	/**
	 * Storico dei tentativi di un esame: data (se `showDate`), voto con esito, rifiutato e note.
	 * Con `deleteAction` ogni tentativo ha "Elimina tentativo" con una conferma in due passi:
	 * con JavaScript la conferma compare subito; senza, il primo invio fa chiedere la
	 * conferma dal server, che rimanda qui l'id in `confirmId`.
	 *
	 * @type {{
	 * 	attempts: import('#lib/grade-rules.js').Attempt[],
	 * 	showDate?: boolean,
	 * 	deleteAction?: string,
	 * 	confirmId?: number | null,
	 * 	cancelHref?: string,
	 * 	label?: string,
	 * }}
	 */
	let { attempts, showDate = true, deleteAction, confirmId = null, cancelHref, label } = $props();

	const t = getT();
	const longDate = getDateFormat({ day: 'numeric', month: 'long', year: 'numeric' });

	/** @param {string} iso */
	const formatDay = (iso) => longDate(isoToUtcDate(iso));

	// Tentativo di cui si sta chiedendo la conferma: segue quello indicato dal server,
	// ma si puo' cambiare dal client (derived scrivibile)
	let confirming = $derived(confirmId);
	let pending = $state(false);
</script>

<ul class="attempt-list" aria-label={label}>
	{#each attempts as attempt (attempt.id)}
		<li class="attempt is-{attemptOutcome(attempt)}">
			{#if showDate}
				<time class="attempt-date" datetime={attempt.date}>{formatDay(attempt.date)}</time>
			{/if}
			<GradeBadge grade={attempt.grade} rejected={attempt.rejected} withOutcome />
			{#if attempt.notes}
				<p class="attempt-notes">{attempt.notes}</p>
			{/if}

			{#if deleteAction}
				<form
					class="attempt-delete"
					method="POST"
					action={deleteAction}
					use:enhance={() => {
						pending = true;
						return async ({ update }) => {
							await update();
							pending = false;
						};
					}}
				>
					<input type="hidden" name="attemptId" value={attempt.id} />
					{#if confirming === attempt.id}
						<input type="hidden" name="confirm" value="1" />
						<p class="attempt-delete-question" role="alert">
							{t('transcript.attempts.confirmDelete', { date: formatDay(attempt.date) })}
						</p>
						<div class="attempt-delete-actions">
							<button
								class="button button-primary attempt-delete-confirm"
								type="submit"
								disabled={pending}
							>
								{t('transcript.attempts.confirm')}
							</button>
							<!-- Senza JavaScript "Annulla" ricarica la pagina, con JavaScript chiude la conferma -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -- percorso gia' risolto dal chiamante -->
							<a
								class="button button-secondary"
								href={cancelHref}
								onclick={(event) => {
									event.preventDefault();
									confirming = null;
								}}
							>
								{t('transcript.attempts.cancel')}
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
						</div>
					{:else}
						<button
							class="button button-secondary"
							type="submit"
							disabled={pending}
							onclick={(event) => {
								event.preventDefault();
								confirming = attempt.id;
							}}
						>
							{t('transcript.attempts.delete')}
						</button>
					{/if}
				</form>
			{/if}
		</li>
	{/each}
</ul>

<style>
	/*
	 * Storico come le righe di un registro: data, voto con esito, note sotto.
	 * Righe separate da un filetto tratteggiato; nel libretto "Elimina tentativo"
	 * va a fine riga quando c'e' spazio, la conferma occupa sempre tutta la riga.
	 */
	.attempt-list {
		container: attempts / inline-size;
		display: flex;
		flex-direction: column;
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.attempt {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-3);
		min-width: 0;
		padding-block: var(--space-2);
	}

	.attempt + .attempt {
		border-top: 1px dashed var(--color-paper-edge);
	}

	.attempt:first-child {
		padding-top: 0;
	}

	.attempt:last-child {
		padding-bottom: 0;
	}

	.attempt-date {
		min-width: 0;
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
	}

	.attempt-notes {
		flex-basis: 100%;
		order: 5;
		max-width: 60ch;
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
		overflow-wrap: anywhere;
	}

	.attempt-delete {
		flex-basis: 100%;
		order: 6;
		margin: 0;
	}

	/* Primo passo: azione distruttiva, in rosso ma ancora secondaria */
	.attempt-delete > .button {
		padding-inline: var(--space-4);
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.attempt-delete > .button:hover:not(:disabled) {
		background: var(--color-danger-soft);
	}

	/* Conferma: riquadro d'avviso con la domanda e le due scelte */
	.attempt-delete:has(.attempt-delete-question) {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4) var(--space-4);
		border-left: 4px solid var(--color-danger);
		border-radius: var(--radius-xs);
		background: var(--color-danger-soft);
	}

	.attempt-delete-question {
		max-width: 60ch;
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.attempt-delete-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-3);
	}

	.attempt-delete-actions .button {
		padding-inline: var(--space-4);
	}

	.attempt-delete-actions .button-secondary {
		background: var(--color-paper);
	}

	.attempt-delete-actions .button-secondary:hover {
		background: var(--color-ink-soft);
	}

	.attempt-delete-confirm {
		border-color: var(--color-danger);
		background: var(--color-danger);
		color: var(--color-on-danger);
	}

	.attempt-delete-confirm:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--color-danger) 80%, var(--color-text));
		background: color-mix(in srgb, var(--color-danger) 80%, var(--color-text));
	}

	@container attempts (min-width: 30rem) {
		.attempt-date {
			flex: 0 0 11rem;
		}

		.attempt-delete:not(:has(.attempt-delete-question)) {
			flex-basis: auto;
			order: 3;
			margin-inline-start: auto;
		}
	}
</style>
