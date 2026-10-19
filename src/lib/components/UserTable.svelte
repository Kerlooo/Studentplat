<script>
	import { resolve } from '$app/paths';
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { ADMIN_TIME_ZONE } from '#lib/admin-rules.js';

	/**
	 * Elenco utenti del pannello: l'email porta alla scheda dell'utente.
	 * @type {{ users: import('#lib/server/admin.js').AdminUserRow[], caption: string }}
	 */
	let { users, caption } = $props();

	const t = getT();
	const dateTime = getDateFormat({
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: ADMIN_TIME_ZONE
	});

	/** @param {string | null} value */
	const formatWhen = (value) => (value ? dateTime(new Date(value)) : t('admin.users.never'));
</script>

<div class="admin-table-wrap">
	<table class="admin-table">
		<caption class="visually-hidden">{caption}</caption>
		<thead>
			<tr>
				<th scope="col">{t('admin.users.columns.email')}</th>
				<th scope="col">{t('admin.users.columns.name')}</th>
				<th scope="col">{t('admin.users.columns.nickname')}</th>
				<th scope="col">{t('admin.users.columns.role')}</th>
				<th scope="col">{t('admin.users.columns.createdAt')}</th>
				<th scope="col">{t('admin.users.columns.lastLoginAt')}</th>
			</tr>
		</thead>
		<tbody>
			{#each users as user (user.id)}
				<tr class="is-{user.role}">
					<th scope="row">
						<a href={resolve('/admin/users/[id]', { id: String(user.id) })}>{user.email}</a>
					</th>
					<td>{user.name}</td>
					<td>{user.nickname ?? ''}</td>
					<td class="is-role">{t(`admin.roles.${user.role}`)}</td>
					<td class="is-date">{formatWhen(user.createdAt)}</td>
					<td class="is-date">{formatWhen(user.lastLoginAt)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	/*
	 * Registro degli utenti. Il foglio scorre in orizzontale al suo interno, mai la pagina;
	 * la colonna dell'email resta ferma e la doppia riga alla sua destra fa da margine
	 * del registro. A destra un'ombra segnala che c'e' altro da scorrere: e' uno sfondo
	 * "scroll" coperto da uno "local" che la nasconde quando si arriva in fondo.
	 *
	 *  Email           || Nome     Nickname  Ruolo   Iscritto    Ultimo accesso  >
	 *  ================||===================================================
	 *  anna@ateneo.it  || Anna     anna      Studente ...
	 */
	.admin-table-wrap {
		--sheet: var(--color-paper);
		--row-hover: color-mix(in srgb, var(--color-ink-soft) 55%, var(--color-paper));
		--double-rule: linear-gradient(var(--color-margin), var(--color-margin));

		max-width: 100%;
		overflow-x: auto;
		overscroll-behavior-x: contain;
		border: 1px solid var(--color-paper-edge);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-pages);
		background:
			linear-gradient(to left, var(--sheet) 40%, transparent) right / 2.5rem 100% no-repeat local,
			radial-gradient(farthest-side at 100% 50%, rgb(var(--color-shadow) / 0.22), transparent)
				right / 0.875rem 100% no-repeat scroll,
			var(--sheet);
	}

	.admin-table {
		width: 100%;
		/* separate: con collapse i bordi delle celle ferme non seguono lo scorrimento */
		border-collapse: separate;
		border-spacing: 0;
	}

	.admin-table th,
	.admin-table td {
		padding: var(--space-3);
		border-bottom: 1px solid var(--color-rule);
		text-align: start;
		vertical-align: baseline;
	}

	.admin-table tbody tr:last-child > * {
		border-bottom: 0;
	}

	/* Intestazione chiusa dalla doppia riga, come la testata del quaderno */
	.admin-table thead th {
		padding-block: var(--space-3) calc(var(--space-2) + 5px);
		border-bottom: 0;
		background:
			var(--double-rule) left bottom / 100% 1px no-repeat,
			var(--double-rule) left calc(100% - 4px) / 100% 1px no-repeat,
			var(--sheet);
		font-size: var(--text-sm);
		font-weight: var(--weight-bold);
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	/* Prima colonna ferma con la doppia riga verticale a destra */
	.admin-table tr > :first-child {
		position: sticky;
		left: 0;
		z-index: 1;
		min-width: 10rem;
		max-width: 14rem;
		padding-inline-end: calc(var(--space-4) + 5px);
		background-color: var(--sheet);
		box-shadow:
			inset -1px 0 var(--color-margin),
			inset -4px 0 var(--sheet),
			inset -5px 0 var(--color-margin);
	}

	.admin-table thead tr > :first-child {
		z-index: 2;
	}

	.admin-table tbody th {
		font-weight: var(--weight-semibold);
		overflow-wrap: anywhere;
	}

	.admin-table td {
		white-space: nowrap;
	}

	.admin-table tbody td {
		color: var(--color-text);
	}

	.admin-table .is-date {
		font-size: var(--text-sm);
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--color-text-muted);
	}

	/* Riga sotto il puntatore: velo d'inchiostro opaco, anche sulla colonna ferma */
	.admin-table tbody tr:hover > * {
		background-color: var(--row-hover);
	}

	.admin-table tbody tr:hover > :first-child {
		box-shadow:
			inset -1px 0 var(--color-margin),
			inset -4px 0 var(--row-hover),
			inset -5px 0 var(--color-margin);
	}

	.admin-table a {
		color: var(--color-ink);
		text-decoration-thickness: 1px;
	}

	.admin-table a:hover {
		color: var(--color-ink-strong);
		text-decoration-thickness: 2px;
	}

	/* Gli amministratori si riconoscono dal ruolo in inchiostro e grassetto, non solo dal colore */
	.is-admin .is-role {
		font-weight: var(--weight-bold);
		color: var(--color-ink);
	}

	@media (min-width: 48rem) {
		.admin-table tr > :first-child {
			max-width: 18rem;
		}
	}

	@media (forced-colors: active) {
		.admin-table tr > :first-child {
			border-right: 3px double CanvasText;
		}
	}
</style>
