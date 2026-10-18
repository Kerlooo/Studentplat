<script>
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { getT } from '#lib/i18n/context.js';

	/**
	 * Finestra modale basata su `<dialog>` nativo aperto con `showModal()`:
	 * il browser rende inerte il resto della pagina (focus trap) e porta il focus dentro.
	 * Esc, il pulsante di chiusura e il clic sullo sfondo impostano `open = false`;
	 * il dialog resta nel DOM finche' l'animazione di uscita non e' finita, poi
	 * il focus torna all'elemento che lo aveva aperto.
	 *
	 * @type {{
	 * 	open: boolean,
	 * 	labelledby: string,
	 * 	onclosed?: () => void,
	 * 	children: import('svelte').Snippet,
	 * }}
	 */
	let { open = $bindable(), labelledby, onclosed, children } = $props();

	const t = getT();

	/** @type {HTMLElement | null} */
	let opener = null;
	/** @type {HTMLElement | undefined} */
	let backdrop = $state();

	const reducedMotion = () =>
		typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

	/**
	 * Il pannello sale e si ingrandisce leggermente; con movimento ridotto solo dissolvenza.
	 * @param {Element} _node
	 * @param {{ duration?: number }} [params]
	 */
	function rise(_node, { duration = 220 } = {}) {
		const still = reducedMotion();
		return {
			duration,
			easing: cubicOut,
			/** @param {number} t */
			css: (t) =>
				still
					? `opacity: ${t}`
					: `opacity: ${t}; transform: translateY(${(1 - t) * 1}rem) scale(${0.97 + t * 0.03})`
		};
	}

	/** @param {HTMLDialogElement} dialog */
	function modal(dialog) {
		opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		dialog.showModal();
		// Focus iniziale esplicito: il browser sceglierebbe il primo elemento focalizzabile,
		// che puo' essere il pannello stesso perche' scorrevole
		// (un contenuto puo' indicarne un altro con l'attributo data-modal-initial-focus)
		const initial = /** @type {HTMLElement | null} */ (
			dialog.querySelector('[data-modal-initial-focus]') ?? dialog.querySelector('.modal-close')
		);
		initial?.focus();

		/** @param {Event} event */
		const onCancel = (event) => {
			// Esc: niente chiusura immediata del browser, si passa dall'animazione
			event.preventDefault();
			open = false;
		};
		/** @param {MouseEvent} event */
		const onClick = (event) => {
			// Solo un clic iniziato e finito sullo sfondo (non un trascinamento dal pannello)
			if (event.target === backdrop) open = false;
		};
		// Chiusura forzata dal browser (es. Esc senza attivazione utente): si riallinea lo stato
		const onClose = () => (open = false);
		dialog.addEventListener('cancel', onCancel);
		dialog.addEventListener('click', onClick);
		dialog.addEventListener('close', onClose);

		return () => {
			dialog.removeEventListener('cancel', onCancel);
			dialog.removeEventListener('click', onClick);
			dialog.removeEventListener('close', onClose);
			// Eseguito a transizioni di uscita concluse, quando il dialog viene smontato
			if (dialog.open) dialog.close();
			if (opener?.isConnected) opener.focus();
			opener = null;
			onclosed?.();
		};
	}
</script>

{#if open}
	<dialog class="modal" aria-labelledby={labelledby} {@attach modal}>
		<div
			class="modal-backdrop"
			bind:this={backdrop}
			transition:fade={{ duration: 240, easing: cubicOut }}
			aria-hidden="true"
		></div>
		<div class="modal-panel" transition:rise={{ duration: 260 }}>
			<button
				class="modal-close button button-secondary"
				type="button"
				onclick={() => (open = false)}
			>
				{t('modal.close')}
			</button>
			{@render children()}
		</div>
	</dialog>
{/if}

<style>
	/*
	 * Il dialog copre tutta la finestra ed e' trasparente: lo sfondo visibile e'
	 * .modal-backdrop (animabile), non ::backdrop.
	 *
	 * Mobile: il pannello e' un foglio che sale dal basso, quasi a tutta altezza.
	 * Da 40rem: foglio di libretto centrato, con il margine rosso e i fogli impilati.
	 */
	.modal {
		position: fixed;
		inset: 0;
		width: 100%;
		max-width: none;
		height: 100%;
		max-height: none;
		margin: 0;
		padding: var(--space-6) 0 0;
		border: 0;
		background: transparent;
		color: var(--color-text);
		display: grid;
		place-items: end stretch;
		overflow: hidden;
	}

	.modal::backdrop {
		background: transparent;
	}

	/* Pagina sotto ferma mentre il popup e' aperto */
	:global(html:has(dialog.modal[open])) {
		overflow: hidden;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgb(var(--color-shadow) / 0.55);
	}

	.modal-panel {
		--margin-x: var(--space-4);
		position: relative;
		width: 100%;
		max-height: calc(100dvh - var(--space-6));
		overflow: auto;
		overscroll-behavior: contain;
		padding: var(--space-4) var(--space-4) calc(var(--space-8) + env(safe-area-inset-bottom, 0px))
			calc(var(--margin-x) + var(--space-5));
		/* Foglio del libretto: doppio margine rosso a sinistra */
		background-color: var(--color-paper);
		background-image: linear-gradient(
			to right,
			transparent var(--margin-x),
			var(--color-margin) var(--margin-x),
			var(--color-margin) calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 5px),
			transparent calc(var(--margin-x) + 5px)
		);
		background-attachment: local;
		border: 1px solid var(--color-paper-edge);
		border-bottom: 0;
		border-radius: var(--radius-md) var(--radius-md) 0 0;
		box-shadow: 0 -12px 32px -16px rgb(var(--color-shadow) / 0.45);
		color: var(--color-text);
	}

	.modal-close {
		float: right;
		margin: 0 0 var(--space-3) var(--space-3);
		padding-inline: var(--space-4);
	}

	@media (min-width: 40rem) {
		.modal {
			place-items: center;
			padding: var(--space-8);
			overflow: auto;
		}

		.modal-panel {
			--margin-x: var(--space-8);
			max-width: 36rem;
			max-height: calc(100dvh - 2 * var(--space-8));
			padding: var(--space-6) var(--space-8) var(--space-8) calc(var(--margin-x) + var(--space-6));
			border-bottom: 1px solid var(--color-paper-edge);
			border-radius: var(--radius-sm);
			box-shadow: var(--shadow-pages);
		}
	}
</style>
