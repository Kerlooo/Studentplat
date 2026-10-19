<script>
	import { enhance } from '$app/forms';

	/**
	 * Azione distruttiva con conferma in due passi e riepilogo di cosa verra' eliminato.
	 * Con JavaScript la conferma compare subito; senza, il primo invio arriva al server
	 * senza `confirm=1` e la pagina torna con `confirming` attivo (come "Elimina tentativo").
	 * `fields` aggiunge campi al form (es. la scelta della destinazione di un'unione):
	 * restano visibili e vengono inviati in entrambi i passi.
	 *
	 * @type {{
	 * 	action: string,
	 * 	label: string,
	 * 	question: string,
	 * 	confirmLabel: string,
	 * 	cancelLabel: string,
	 * 	cancelHref: string,
	 * 	details?: string[],
	 * 	hidden?: Record<string, string | number>,
	 * 	confirming?: boolean,
	 * 	disabled?: boolean,
	 * 	fields?: import('svelte').Snippet,
	 * }}
	 */
	let {
		action,
		label,
		question,
		confirmLabel,
		cancelLabel,
		cancelHref,
		details = [],
		hidden = {},
		confirming: confirmingFromServer = false,
		disabled = false,
		fields
	} = $props();

	// Segue la richiesta di conferma del server, ma si apre e chiude anche dal client
	let confirming = $derived(confirmingFromServer);
	let pending = $state(false);
</script>

<form
	class="danger-form"
	class:is-confirming={confirming}
	method="POST"
	{action}
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			await update({ reset: false });
			pending = false;
		};
	}}
>
	{#each Object.entries(hidden) as [name, value] (name)}
		<input type="hidden" {name} {value} />
	{/each}

	{@render fields?.()}

	{#if confirming}
		<input type="hidden" name="confirm" value="1" />
		<div class="danger-form-confirm" role="alert">
			<p class="danger-form-question">{question}</p>
			{#if details.length > 0}
				<ul class="danger-form-details">
					{#each details as detail, i (i)}
						<li>{detail}</li>
					{/each}
				</ul>
			{/if}
		</div>
		<div class="danger-form-actions">
			<button class="button danger-form-submit" type="submit" disabled={pending || disabled}>
				{confirmLabel}
			</button>
			<!-- Senza JavaScript "Annulla" ricarica la pagina, con JavaScript chiude la conferma -->
			<!-- eslint-disable svelte/no-navigation-without-resolve -- percorso gia' risolto dal chiamante -->
			<a
				class="button button-secondary"
				href={cancelHref}
				onclick={(event) => {
					event.preventDefault();
					confirming = false;
				}}
			>
				{cancelLabel}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>
	{:else}
		<div class="danger-form-actions">
			<button
				class="button button-secondary danger-form-start"
				type="submit"
				disabled={pending || disabled}
				onclick={(event) => {
					event.preventDefault();
					// Campi obbligatori di `fields` (es. la destinazione) controllati prima della conferma
					if (event.currentTarget.form?.reportValidity() !== false) confirming = true;
				}}
			>
				{label}
			</button>
		</div>
	{/if}
</form>

<style>
	.danger-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		margin: 0;
	}

	/*
	 * Conferma: riquadro d'avviso con domanda, riepilogo e le due scelte.
	 * Bordo pieno in rosso piu' la fascia a sinistra (come AttemptList, ma piu' marcato
	 * perche' qui si cancellano dati di altri): si distingue anche senza percepire il colore.
	 * Compare con un breve scatto verso il basso, che risponde al clic sul primo pulsante.
	 */
	.danger-form.is-confirming {
		gap: var(--space-4);
		padding: var(--space-4) var(--space-4) var(--space-5) var(--space-5);
		border: 1px solid var(--color-danger);
		border-left-width: 5px;
		border-radius: var(--radius-sm);
		background: var(--color-danger-soft);
		animation: danger-confirm-in var(--duration-turn) var(--ease-out);
	}

	@keyframes danger-confirm-in {
		from {
			opacity: 0;
			transform: translateY(-0.25rem);
		}
	}

	.danger-form-confirm {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.danger-form-question {
		max-width: 60ch;
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		color: var(--color-text);
		overflow-wrap: anywhere;
	}

	/* Riepilogo: trattini rossi al posto dei pallini, come voci depennate */
	.danger-form-details {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		max-width: 60ch;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.danger-form-details li {
		position: relative;
		padding-inline-start: var(--space-5);
		color: var(--color-text);
	}

	.danger-form-details li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.75em;
		width: 0.625rem;
		border-top: 2px solid var(--color-danger);
	}

	.danger-form-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-3);
	}

	.danger-form-actions .button {
		padding-inline: var(--space-4);
	}

	/* Primo passo: in rosso ma ancora secondario */
	.danger-form-start {
		border-color: var(--color-danger);
		color: var(--color-danger);
	}

	.danger-form-start:hover:not(:disabled) {
		background: var(--color-danger-soft);
	}

	/* Secondo passo: pulsante pieno, l'unico gesto irreversibile della pagina */
	.danger-form-submit {
		border-color: var(--color-danger);
		background: var(--color-danger);
		color: var(--color-on-danger);
		box-shadow: var(--shadow-press);
	}

	.danger-form-submit:hover:not(:disabled) {
		border-color: color-mix(in srgb, var(--color-danger) 80%, var(--color-text));
		background: color-mix(in srgb, var(--color-danger) 80%, var(--color-text));
	}

	/* Anello di focus in rosso sulle azioni distruttive, distanziato dal riquadro */
	.danger-form-start:focus-visible,
	.danger-form-submit:focus-visible {
		outline-color: var(--color-danger);
		outline-offset: 3px;
	}

	.danger-form.is-confirming .button-secondary {
		background: var(--color-paper);
	}

	.danger-form.is-confirming .button-secondary:hover {
		background: var(--color-ink-soft);
	}

	@media (forced-colors: active) {
		.danger-form-details li::before {
			border-top-color: CanvasText;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.danger-form.is-confirming {
			animation: none;
		}
	}
</style>
