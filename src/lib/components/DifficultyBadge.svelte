<script>
	import { getT } from '#lib/i18n/context.js';

	/**
	 * Etichetta testuale della difficolta' personale ("Difficile"), con la classe del livello
	 * (`is-easy`, `is-medium`, `is-hard`). Gli screen reader leggono "difficolta': difficile".
	 * Il colore del livello va solo sul pallino, mai sul testo.
	 *
	 * @type {{ difficulty: import('#lib/difficulty-rules.js').Difficulty }}
	 */
	let { difficulty } = $props();

	const t = getT();

	let label = $derived(t(`difficulty.${difficulty}`));
</script>

<span class="difficulty-badge is-{difficulty}">
	<span aria-hidden="true">{label}</span>
	<span class="visually-hidden">{t('difficulty.srPrefix', { level: label.toLowerCase() })}</span>
</span>

<style>
	/*
	 * Segno a tacche crescenti, come un indicatore di livello: Facile 1 tacca piena,
	 * Media 2, Difficile 3. Il livello si legge dalla forma oltre che dal colore,
	 * e il segno non si confonde con il cerchio rosso dell'esito "non superato".
	 * Il testo resta nel colore del contesto (mai nel colore della difficolta').
	 */
	.difficulty-badge {
		--difficulty-empty: color-mix(in srgb, var(--color-text-muted) 30%, transparent);
		--bar-1: var(--difficulty-color);
		--bar-2: var(--difficulty-empty);
		--bar-3: var(--difficulty-empty);

		display: inline-flex;
		align-items: baseline;
		gap: var(--space-1);
		white-space: nowrap;
	}

	.difficulty-badge::before {
		content: '';
		flex: none;
		align-self: center;
		width: 11px;
		height: 0.625rem;
		background:
			linear-gradient(var(--bar-1), var(--bar-1)) left bottom / 3px 40% no-repeat,
			linear-gradient(var(--bar-2), var(--bar-2)) center bottom / 3px 70% no-repeat,
			linear-gradient(var(--bar-3), var(--bar-3)) right bottom / 3px 100% no-repeat;
	}

	.is-easy {
		--difficulty-color: var(--color-difficulty-easy);
	}

	.is-medium {
		--difficulty-color: var(--color-difficulty-medium);
		--bar-2: var(--difficulty-color);
	}

	.is-hard {
		--difficulty-color: var(--color-difficulty-hard);
		--bar-2: var(--difficulty-color);
		--bar-3: var(--difficulty-color);
	}

	/* Contrasto elevato: tacche piene in CanvasText, vuote in GrayText */
	@media (forced-colors: active) {
		.difficulty-badge {
			--difficulty-color: CanvasText;
			--difficulty-empty: GrayText;
		}

		.difficulty-badge::before {
			forced-color-adjust: none;
		}
	}
</style>
