<script>
	import { resolve } from '$app/paths';
	import { getNumberFormat, getT } from '#lib/i18n/context.js';

	/**
	 * CFU ottenuti rispetto ai CFU totali del corso indicati nel profilo.
	 * Senza totale mostra solo i CFU ottenuti e invita a impostarlo.
	 *
	 * @type {{ earned: number, total: number | null }}
	 */
	let { earned, total } = $props();

	const t = getT();
	const number = getNumberFormat();
	const percentFormat = getNumberFormat({ style: 'percent', maximumFractionDigits: 0 });

	// La barra si ferma al totale anche se i CFU ottenuti lo superano
	let shown = $derived(total ? Math.min(earned, total) : 0);
	// Per difetto: il 100% compare solo a corso completato
	let percent = $derived(total ? Math.floor((shown / total) * 100) : 0);
	let progressText = $derived(
		total
			? t('dashboard.overview.cfu.progress', { earned: number(earned), total: number(total) })
			: ''
	);
</script>

<section class="cfu paper-ruled" aria-labelledby="cfu-heading">
	<h2 class="cfu-heading" id="cfu-heading">{t('dashboard.overview.cfu.heading')}</h2>

	{#if total}
		<p class="cfu-count">{progressText}</p>
		<progress
			class="cfu-bar"
			max={total}
			value={shown}
			aria-labelledby="cfu-heading"
			aria-valuetext={progressText}
		></progress>
		<p class="cfu-percent">
			{t('dashboard.overview.cfu.percent', { percent: percentFormat(percent / 100) })}
		</p>
	{:else}
		<p class="cfu-count">{t('dashboard.overview.cfu.earned', { earned: number(earned) })}</p>
		<p class="cfu-hint">{t('dashboard.overview.cfu.noTotal')}</p>
		<a class="button button-secondary" href={resolve('/dashboard/profile')}>
			{t('dashboard.overview.cfu.setTotal')}
		</a>
	{/if}
</section>

<style>
	/*
	 * Pagina del libretto con i CFU scritti sulle righe.
	 * Ogni elemento occupa un numero intero di righi (passo --rule-pitch, 28px):
	 * nessun gap, padding verticale di un rigo, line-height pari al passo.
	 * Con riga di 28px le linee di base cadono 6-9px sopra il fondo del rigo
	 * (Source Serif a 21-24px ~6px, Atkinson a 14-16px ~8-9px): alzare le righe
	 * di 4px (--rule-shift) le porta appena sotto la scrittura, come nella vetrina.
	 *
	 * La barra occupa un rigo intero e poggia sulla riga stessa: e' la casella
	 * del modulo che si riempie d'inchiostro man mano che si ottengono CFU.
	 */
	.cfu {
		--rule-shift: -0.25rem;
		--bar-height: 0.75rem;

		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
		padding: var(--rule-pitch) var(--space-5) var(--rule-pitch) var(--space-8);
		line-height: var(--rule-pitch);
		background-position: 0 var(--rule-shift);
	}

	.cfu-heading {
		font-family: var(--font-display);
		font-size: var(--text-lg);
		line-height: var(--rule-pitch);
		color: var(--color-ink);
	}

	.cfu-count {
		font-family: var(--font-display);
		font-size: var(--text-xl);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--color-text);
		text-wrap: balance;
	}

	/* Barra: fondo appoggiato alla riga (margine inferiore = spostamento delle righe) */
	.cfu-bar {
		display: block;
		width: 100%;
		height: var(--bar-height);
		margin-top: calc(var(--rule-pitch) - var(--bar-height) + var(--rule-shift));
		margin-bottom: calc(-1 * var(--rule-shift));
		padding: 0;
		appearance: none;
		border: 1px solid var(--color-ink);
		border-radius: var(--radius-xs);
		background: var(--color-ink-soft);
		color: var(--color-ink);
		overflow: hidden;
	}

	.cfu-bar::-webkit-progress-bar {
		background: var(--color-ink-soft);
		border-radius: 0;
	}

	.cfu-bar::-webkit-progress-value {
		background: var(--color-ink);
		border-radius: 0;
	}

	.cfu-bar::-moz-progress-bar {
		background: var(--color-ink);
		border-radius: 0;
	}

	.cfu-percent,
	.cfu-hint {
		max-width: 60ch;
		color: var(--color-text-muted);
	}

	.cfu-percent {
		font-size: var(--text-sm);
	}

	/* Pulsante alto due righi, con il bordo inferiore sulla riga */
	.cfu > .button {
		margin-top: calc(2 * var(--rule-pitch) - 2.75rem + var(--rule-shift));
		margin-bottom: calc(-1 * var(--rule-shift));
	}

	@media (min-width: 30rem) {
		.cfu {
			padding-inline: var(--space-12) var(--space-8);
		}
	}

	/* Contrasto elevato: colori di sistema, la barra resta leggibile */
	@media (forced-colors: active) {
		.cfu-bar {
			border-color: CanvasText;
			background: Canvas;
		}

		.cfu-bar::-webkit-progress-bar {
			background: Canvas;
		}

		.cfu-bar::-webkit-progress-value {
			background: Highlight;
		}

		.cfu-bar::-moz-progress-bar {
			background: Highlight;
		}
	}
</style>
