<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';

	const t = getT();

	// Voci dell'area riservata. "Esami" andra' aggiunta qui:
	// { path: '/dashboard/exams', label: 'dashboard.nav.exams', exact: false }
	const items = /** @type {const} */ ([
		{ path: '/dashboard', label: 'dashboard.nav.overview', exact: true },
		{ path: '/dashboard/calendar', label: 'dashboard.nav.calendar', exact: false },
		{ path: '/dashboard/profile', label: 'dashboard.nav.profile', exact: false }
	]);

	/** @param {{ path: (typeof items)[number]['path'], exact: boolean }} item */
	const isCurrent = (item) => {
		// resolve() in SSR puo' restituire percorsi relativi: si confronta il pathname assoluto
		const href = new URL(resolve(item.path), page.url.href).pathname;
		return item.exact
			? page.url.pathname === href
			: page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	};
</script>

<div class="dashboard-bar">
	<nav class="dashboard-nav" aria-label={t('dashboard.nav.label')}>
		<ul class="dashboard-nav-list">
			{#each items as item (item.path)}
				<li>
					<a
						class="dashboard-nav-link"
						href={resolve(item.path)}
						aria-current={isCurrent(item) ? 'page' : undefined}
					>
						{t(item.label)}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<!-- Endpoint POST /logout: form classico, la navigazione completa azzera lo stato del client -->
	<form class="logout-form" method="POST" action="/logout">
		<button class="button button-secondary" type="submit">{t('dashboard.logout')}</button>
	</form>
</div>

<style>
	/*
	 * Mobile: barra in alto chiusa dalla doppia riga rossa d'intestazione del quaderno.
	 * Desktop (>= 56rem): colonna laterale; la doppia riga diventa verticale
	 * e fa da margine tra l'indice e la pagina.
	 */
	.dashboard-bar {
		--double-rule: linear-gradient(var(--color-margin), var(--color-margin));

		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3) var(--space-4);
		padding-bottom: var(--space-4);
		background:
			var(--double-rule) left bottom / 100% 1px no-repeat,
			var(--double-rule) left calc(100% - 4px) / 100% 1px no-repeat;
	}

	.dashboard-nav {
		min-width: 0;
	}

	.dashboard-nav-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.dashboard-nav-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 var(--space-3);
		border-radius: var(--radius-xs);
		color: var(--color-text-muted);
		font-weight: var(--weight-bold);
		font-size: var(--text-md);
		text-decoration: none;
		/* Evidenziatore pronto, a larghezza zero finche' la voce non e' attiva */
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left center;
		background-size: 0% 70%;
	}

	.dashboard-nav-link:hover {
		color: var(--color-ink);
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	/* Voce attiva: passata di evidenziatore, come le schede di accesso */
	.dashboard-nav-link[aria-current='page'] {
		color: var(--color-on-highlight);
		background-size: 100% 70%;
		animation: nav-highlight-swipe var(--duration-mark) var(--ease-out);
	}

	.dashboard-nav-link[aria-current='page']:hover {
		text-decoration: none;
	}

	.logout-form {
		margin: 0;
	}

	@keyframes nav-highlight-swipe {
		from {
			background-size: 0% 70%;
		}
		to {
			background-size: 100% 70%;
		}
	}

	@media (min-width: 56rem) {
		.dashboard-bar {
			position: sticky;
			top: var(--space-6);
			flex-direction: column;
			flex-wrap: nowrap;
			align-items: stretch;
			justify-content: flex-start;
			gap: var(--space-8);
			padding: var(--space-2) var(--space-6) var(--space-4) 0;
			background:
				var(--double-rule) right top / 1px 100% no-repeat,
				var(--double-rule) calc(100% - 4px) top / 1px 100% no-repeat;
		}

		.dashboard-nav-list {
			flex-direction: column;
			flex-wrap: nowrap;
			gap: var(--space-1);
		}

		/* La passata copre solo la parola, non tutta la riga */
		.dashboard-nav-link {
			display: flex;
			width: fit-content;
			max-width: 100%;
		}

		.logout-form {
			padding-top: var(--space-4);
			border-top: 1px solid var(--color-paper-edge);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.dashboard-nav-link[aria-current='page'] {
			animation: none;
		}
	}
</style>
