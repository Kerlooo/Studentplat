<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { getT } from '#lib/i18n/context.js';

	const t = getT();

	// Voci del pannello admin
	const items = /** @type {const} */ ([
		{ path: '/admin', label: 'admin.nav.overview', exact: true },
		{ path: '/admin/users', label: 'admin.nav.users', exact: false },
		{ path: '/admin/exams', label: 'admin.nav.exams', exact: false }
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

<div class="admin-bar">
	<nav class="admin-nav" aria-label={t('admin.nav.label')}>
		<ul class="admin-nav-list">
			{#each items as item (item.path)}
				<li>
					<a
						class="admin-nav-link"
						href={resolve(item.path)}
						aria-current={isCurrent(item) ? 'page' : undefined}
					>
						{t(item.label)}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<div class="admin-bar-exit">
		<a class="admin-back-link" href={resolve('/dashboard')}>{t('admin.nav.back')}</a>
		<!-- Endpoint POST /logout: form classico, la navigazione completa azzera lo stato del client -->
		<form class="logout-form" method="POST" action="/logout">
			<button class="button button-secondary" type="submit">{t('dashboard.logout')}</button>
		</form>
	</div>
</div>

<style>
	/*
	 * Stessa struttura di DashboardNav: barra in alto su mobile, colonna laterale
	 * da 56rem con la doppia riga come margine. Nel pannello la riga e' in inchiostro blu
	 * (--color-margin ridefinito in /admin/+layout.svelte): e' il segno dell'area admin.
	 * Qui c'e' in piu' il rientro alla dashboard, accanto all'uscita.
	 */
	.admin-bar {
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

	.admin-nav {
		min-width: 0;
	}

	.admin-nav-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1) var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.admin-nav-link {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		padding: 0 var(--space-3);
		border-radius: var(--radius-xs);
		color: var(--color-text-muted);
		font-weight: var(--weight-bold);
		font-size: var(--text-md);
		text-decoration: none;
		background-image: linear-gradient(var(--color-highlight), var(--color-highlight));
		background-repeat: no-repeat;
		background-position: left center;
		background-size: 0% 70%;
	}

	.admin-nav-link:hover {
		color: var(--color-ink);
		text-decoration: underline;
		text-decoration-thickness: 2px;
	}

	.admin-nav-link[aria-current='page'] {
		color: var(--color-on-highlight);
		background-size: 100% 70%;
		animation: admin-highlight-swipe var(--duration-mark) var(--ease-out);
	}

	.admin-nav-link[aria-current='page']:hover {
		text-decoration: none;
	}

	@keyframes admin-highlight-swipe {
		from {
			background-size: 0% 70%;
		}
		to {
			background-size: 100% 70%;
		}
	}

	.admin-bar-exit {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
	}

	/* Rientro alla dashboard: freccia verso sinistra, come quella del libretto */
	.admin-back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2.75rem;
		font-weight: var(--weight-bold);
		color: var(--color-ink);
		text-decoration-thickness: 1px;
	}

	.admin-back-link::before {
		content: '';
		flex: none;
		width: 0.45rem;
		height: 0.45rem;
		border-left: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(45deg);
	}

	.admin-back-link:hover {
		color: var(--color-ink-strong);
		text-decoration-thickness: 2px;
	}

	.logout-form {
		margin: 0;
	}

	@media (min-width: 56rem) {
		.admin-bar {
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

		.admin-nav-list {
			flex-direction: column;
			flex-wrap: nowrap;
			gap: var(--space-1);
		}

		.admin-nav-link {
			display: flex;
			width: fit-content;
			max-width: 100%;
		}

		.admin-bar-exit {
			flex-direction: column;
			align-items: flex-start;
			padding-top: var(--space-4);
			border-top: 1px solid var(--color-paper-edge);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.admin-nav-link[aria-current='page'] {
			animation: none;
		}
	}
</style>
