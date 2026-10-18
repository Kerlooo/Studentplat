<script>
	import { resolve } from '$app/paths';
	import { getNumberFormat, getT } from '#lib/i18n/context.js';

	const t = getT();

	const registerHref = resolve('/login?tab=register');
	const loginHref = resolve('/login');

	// Libretto d'esempio dell'hero: dati illustrativi, le medie sono calcolate davvero.
	// Voto 31 = 30 e lode, che nella media vale 31.
	const sampleExams = [
		{ name: 'landing.sample.exam1', cfu: 12, grade: 27 },
		{ name: 'landing.sample.exam2', cfu: 9, grade: 31 },
		{ name: 'landing.sample.exam3', cfu: 6, grade: 24 }
	];
	const arithmetic = sampleExams.reduce((sum, exam) => sum + exam.grade, 0) / sampleExams.length;
	const totalCfu = sampleExams.reduce((sum, exam) => sum + exam.cfu, 0);
	const weighted = sampleExams.reduce((sum, exam) => sum + exam.grade * exam.cfu, 0) / totalCfu;

	const formatAverage = getNumberFormat({ minimumFractionDigits: 2, maximumFractionDigits: 2 });

	// Funzionalita': non sono una sequenza, quindi lista non numerata
	const features = ['transcript', 'average', 'chart', 'calendar', 'catalog'];

	// "Come funziona": sequenza reale, lista ordinata
	const steps = ['account', 'profile', 'exams'];
</script>

<svelte:head>
	<title>{t('meta.appName')} - {t('meta.homeTitle')}</title>
	<meta name="description" content={t('meta.homeDescription')} />
</svelte:head>

<div class="landing">
	<section class="landing-hero" aria-labelledby="landing-hero-title">
		<div class="landing-hero-text">
			<h1 class="landing-hero-title" id="landing-hero-title">{t('landing.hero.title')}</h1>
			<p class="landing-hero-lead">{t('landing.hero.lead')}</p>
			<div class="landing-actions">
				<a class="button button-primary" href={registerHref}>{t('landing.hero.register')}</a>
				<a class="button button-secondary" href={loginHref}>{t('landing.hero.login')}</a>
			</div>
		</div>

		<figure class="landing-sample paper-ruled">
			<table class="landing-sample-table">
				<thead>
					<tr>
						<th scope="col">{t('landing.sample.exam')}</th>
						<th scope="col" class="landing-sample-num">{t('landing.sample.cfu')}</th>
						<th scope="col" class="landing-sample-num">{t('landing.sample.grade')}</th>
					</tr>
				</thead>
				<tbody>
					{#each sampleExams as exam (exam.name)}
						<tr>
							<th scope="row">{t(exam.name)}</th>
							<td class="landing-sample-num">{exam.cfu}</td>
							<td class="landing-sample-num">
								{#if exam.grade === 31}
									<abbr class="landing-sample-lode" title={t('landing.sample.lode')}
										>{t('landing.sample.lodeShort')}</abbr
									>
								{:else}
									{exam.grade}
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<dl class="landing-sample-averages">
				<div class="landing-sample-average">
					<dt>{t('landing.sample.arithmetic')}</dt>
					<dd>{formatAverage(arithmetic)}</dd>
				</div>
				<div class="landing-sample-average">
					<dt>{t('landing.sample.weighted')}</dt>
					<dd>{formatAverage(weighted)}</dd>
				</div>
			</dl>
			<figcaption class="landing-sample-caption">
				{t('landing.sample.caption')}. {t('landing.sample.note')}
			</figcaption>
		</figure>
	</section>

	<section class="landing-features" aria-labelledby="landing-features-title">
		<h2 class="landing-section-title" id="landing-features-title">
			{t('landing.features.title')}
		</h2>
		<ul class="landing-feature-list">
			{#each features as feature (feature)}
				<li class="landing-feature landing-feature-{feature}">
					<h3 class="landing-feature-title">{t(`landing.features.${feature}.title`)}</h3>
					<p class="landing-feature-text">{t(`landing.features.${feature}.text`)}</p>
				</li>
			{/each}
		</ul>
	</section>

	<section class="landing-steps" aria-labelledby="landing-steps-title">
		<h2 class="landing-section-title" id="landing-steps-title">{t('landing.steps.title')}</h2>
		<ol class="landing-step-list">
			{#each steps as step (step)}
				<li class="landing-step">
					<h3 class="landing-step-title">{t(`landing.steps.${step}.title`)}</h3>
					<p class="landing-step-text">{t(`landing.steps.${step}.text`)}</p>
				</li>
			{/each}
		</ol>
	</section>

	<section class="landing-cta" aria-labelledby="landing-cta-title">
		<h2 class="landing-cta-title" id="landing-cta-title">{t('landing.cta.title')}</h2>
		<p class="landing-cta-text">{t('landing.cta.text')}</p>
		<div class="landing-actions">
			<a class="button button-primary" href={registerHref}>{t('landing.cta.register')}</a>
			<a class="button button-secondary" href={loginHref}>{t('landing.cta.login')}</a>
		</div>
	</section>

	<footer class="landing-footer">
		<p class="landing-footer-text">{t('landing.footer.text')}</p>
	</footer>
</div>

<style>
	/*
	 * Vetrina. L'elemento memorabile e' il libretto d'esempio: una pagina rigata
	 * dove tutto sta sulle righe, il "stampato" (intestazioni, etichette) e' in
	 * grafite e lo "scritto a penna" (voti, medie) in inchiostro blu. Il 30 e lode
	 * e' cerchiato a mano e la media ponderata viene evidenziata al caricamento:
	 * e' l'unica animazione della pagina, ed e' la promessa del titolo
	 * ("i conti gia' fatti"). Il resto della pagina resta sobrio.
	 */

	.landing {
		display: flex;
		flex-direction: column;
		gap: var(--space-16);
	}

	/* ---------- Hero ---------- */

	.landing-hero {
		display: grid;
		gap: var(--space-12);
		align-items: center;
		padding-top: var(--space-4);
	}

	.landing-hero-text {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		min-width: 0;
	}

	.landing-hero-title {
		max-width: 15ch;
		font-family: var(--font-display);
		font-optical-sizing: auto;
		font-weight: var(--weight-bold);
		font-size: clamp(2.25rem, 6vw + 1rem, var(--text-4xl));
		line-height: var(--leading-tight);
		letter-spacing: -0.02em;
		color: var(--color-text);
	}

	.landing-hero-lead {
		max-width: 36rem;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.landing-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
	}

	/* ---------- Libretto d'esempio ---------- */

	.landing-sample {
		/* Tutto il contenuto si appoggia alle righe: ogni riga di testo e' alta un passo */
		--line: var(--rule-pitch);
		margin: 0;
		width: 100%;
		max-width: 30rem;
		padding: var(--line) var(--space-4) var(--line) calc(var(--margin-x) + var(--space-4));
		line-height: var(--line);
	}

	.landing-sample-table {
		width: 100%;
		border-collapse: collapse;
	}

	.landing-sample-table th,
	.landing-sample-table td {
		height: var(--line);
		padding: 0;
		vertical-align: bottom;
	}

	.landing-sample-table th {
		text-align: left;
		font-weight: var(--weight-regular);
	}

	/* Intestazioni stampate sul modulo */
	.landing-sample-table thead th {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.landing-sample-table tbody th {
		padding-right: var(--space-3);
		color: var(--color-text);
	}

	.landing-sample-table .landing-sample-num {
		width: 3.25rem;
		text-align: right;
	}

	/* Voti scritti a penna */
	.landing-sample-table tbody td:last-child {
		font-family: var(--font-display);
		font-weight: var(--weight-semibold);
		font-size: var(--text-lg);
		color: var(--color-ink);
	}

	.landing-sample-table tbody td:nth-child(2) {
		color: var(--color-text-muted);
	}

	/* 30 e lode cerchiato a mano */
	.landing-sample-lode {
		position: relative;
		display: inline-block;
		text-decoration: none;
		cursor: help;
	}

	.landing-sample-lode::after {
		content: '';
		position: absolute;
		inset: -0.05em -0.3em -0.1em -0.35em;
		border: 2px solid var(--color-ink);
		border-radius: 50% 46% 52% 48%;
		transform: rotate(-7deg);
		pointer-events: none;
	}

	.landing-sample-averages {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0 var(--space-4);
		margin: var(--line) 0 0;
	}

	.landing-sample-average dt {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.landing-sample-average dd {
		justify-self: start;
		width: fit-content;
		margin: 0;
		padding-inline: var(--space-1);
		margin-left: calc(var(--space-1) * -1);
		font-family: var(--font-display);
		font-weight: var(--weight-bold);
		font-size: var(--text-xl);
		color: var(--color-ink);
	}

	/* La media ponderata, passata di evidenziatore */
	.landing-sample-average:last-child dd {
		color: var(--color-on-highlight);
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left 70%;
		background-size: 100% 65%;
		border-radius: var(--radius-xs);
		animation: mark-average 700ms var(--ease-out) 700ms both;
	}

	@keyframes mark-average {
		from {
			background-size: 0% 65%;
			color: var(--color-ink);
		}
		60% {
			color: var(--color-on-highlight);
		}
		to {
			background-size: 100% 65%;
			color: var(--color-on-highlight);
		}
	}

	.landing-sample-caption {
		margin-top: var(--line);
		max-width: 46ch;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	/* ---------- Titoli di sezione ---------- */

	.landing-section-title,
	.landing-cta-title {
		font-family: var(--font-display);
		font-weight: var(--weight-bold);
		font-size: clamp(1.75rem, 3vw + 1rem, var(--text-2xl));
		line-height: var(--leading-snug);
	}

	/* ---------- Funzionalita': indice del libretto, non card ---------- */

	.landing-features {
		display: grid;
		gap: var(--space-6);
	}

	.landing-feature-list {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		border-bottom: 1px solid var(--color-paper-edge);
	}

	.landing-feature {
		display: grid;
		gap: var(--space-2);
		padding-block: var(--space-5);
		border-top: 1px solid var(--color-paper-edge);
	}

	.landing-feature-title {
		font-size: var(--text-lg);
		color: var(--color-text);
	}

	.landing-feature-text {
		max-width: 60ch;
		color: var(--color-text-muted);
	}

	/* ---------- Come funziona: sequenza reale, numeri stampati ---------- */

	.landing-steps {
		display: grid;
		gap: var(--space-6);
	}

	.landing-step-list {
		display: grid;
		gap: var(--space-8);
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.landing-step {
		counter-increment: step;
		display: grid;
		grid-template-columns: 2.75rem minmax(0, 1fr);
		grid-template-rows: auto 1fr;
		column-gap: var(--space-4);
		row-gap: var(--space-1);
	}

	.landing-step::before {
		content: counter(step);
		grid-row: 1 / span 2;
		font-family: var(--font-display);
		font-weight: var(--weight-bold);
		font-size: var(--text-3xl);
		line-height: 1;
		color: var(--color-ink);
		/* Il numero sta sul margine rosso, come la numerazione a bordo pagina */
		padding-right: var(--space-2);
		border-right: 2px solid var(--color-margin);
		text-align: right;
	}

	.landing-step-title {
		grid-column: 2;
		font-size: var(--text-lg);
	}

	.landing-step-text {
		grid-column: 2;
		max-width: 44ch;
		color: var(--color-text-muted);
	}

	/* ---------- CTA finale: la copertina del libretto ---------- */

	.landing-cta {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-4);
		padding: var(--space-10) var(--space-6);
		border-radius: var(--radius-md);
		background: var(--color-ink);
		color: var(--color-on-ink);
		/* Cornice impressa come sulle copertine rilegate */
		box-shadow:
			inset 0 0 0 var(--space-2) var(--color-ink),
			inset 0 0 0 calc(var(--space-2) + 1px)
				color-mix(in srgb, var(--color-on-ink) 45%, transparent),
			var(--shadow-press);
	}

	.landing-cta-title {
		color: var(--color-on-ink);
	}

	.landing-cta-text {
		max-width: 44ch;
		font-size: var(--text-md);
	}

	.landing-cta .landing-actions {
		margin-top: var(--space-2);
	}

	.landing-cta .button-primary {
		background: var(--color-highlight);
		color: var(--color-on-highlight);
	}

	.landing-cta .button-primary:hover {
		background: color-mix(in srgb, var(--color-highlight) 85%, var(--color-on-ink));
	}

	.landing-cta .button-secondary {
		border-color: var(--color-on-ink);
		color: var(--color-on-ink);
	}

	.landing-cta .button-secondary:hover {
		background: color-mix(in srgb, var(--color-on-ink) 14%, transparent);
	}

	/* Sul blu il focus standard (blu) non si vedrebbe */
	.landing-cta .button:focus-visible {
		outline-color: var(--color-on-ink);
		outline-offset: 3px;
	}

	/* ---------- Footer ---------- */

	.landing-footer {
		margin-top: calc(var(--space-8) * -1);
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-paper-edge);
	}

	.landing-footer-text {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	/* ---------- Schermi piu' larghi ---------- */

	@media (min-width: 40rem) {
		.landing-feature {
			grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
			gap: var(--space-6);
			align-items: baseline;
		}

		.landing-cta {
			padding: var(--space-12) var(--space-12);
		}
	}

	@media (min-width: 56rem) {
		.landing {
			gap: calc(var(--space-16) + var(--space-8));
		}

		.landing-hero {
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
			gap: var(--space-16);
			min-height: 68vh;
			padding-top: var(--space-8);
		}

		.landing-hero-lead {
			font-size: var(--text-lg);
		}

		/* La pagina appoggiata sulla scrivania, appena storta */
		.landing-sample {
			justify-self: end;
			transform: rotate(-1.25deg);
		}

		.landing-features {
			grid-template-columns: minmax(0, 1fr) minmax(0, 2.4fr);
			gap: var(--space-10);
			align-items: start;
		}

		.landing-step-list {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: var(--space-10);
		}

		.landing-footer {
			margin-top: calc(var(--space-16) * -1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.landing-sample-average:last-child dd {
			animation: none;
		}
	}
</style>
