<script>
	import { resolve } from '$app/paths';
	import { getNumberFormat, getT } from '#lib/i18n/context.js';

	/**
	 * Catalogo degli esami nel pannello: il nome porta al dettaglio dell'esame,
	 * il creatore alla sua scheda (o "utente eliminato").
	 * @type {{ exams: import('#lib/server/admin.js').AdminExam[], caption: string }}
	 */
	let { exams, caption } = $props();

	const t = getT();
	const number = getNumberFormat();
</script>

<div class="admin-table-wrap">
	<table class="admin-table">
		<caption class="visually-hidden">{caption}</caption>
		<thead>
			<tr>
				<th scope="col">{t('admin.exams.columns.name')}</th>
				<th scope="col" class="is-number">{t('admin.exams.columns.cfu')}</th>
				<th scope="col">{t('admin.exams.columns.creator')}</th>
				<th scope="col" class="is-number">{t('admin.exams.columns.userExams')}</th>
				<th scope="col" class="is-number">{t('admin.exams.columns.attempts')}</th>
			</tr>
		</thead>
		<tbody>
			{#each exams as exam (exam.id)}
				<tr>
					<th scope="row">
						<a href={resolve('/admin/exams/[id]', { id: String(exam.id) })}>{exam.name}</a>
					</th>
					<td class="is-number">{number(exam.cfu)}</td>
					<td>
						{#if exam.creator}
							<a href={resolve('/admin/users/[id]', { id: String(exam.creator.id) })}>
								{exam.creator.email}
							</a>
						{:else}
							<span class="admin-table-muted">{t('admin.exams.deletedUser')}</span>
						{/if}
					</td>
					<td class="is-number">{number(exam.userExams)}</td>
					<td class="is-number">{number(exam.attempts)}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	/*
	 * Stesso registro di UserTable: scorre dentro il foglio, il nome dell'esame resta
	 * fermo a sinistra della doppia riga, ombra a destra finche' c'e' altro da vedere.
	 * Le colonne numeriche sono allineate a destra con cifre tabellari.
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

	.admin-table tr > :first-child {
		position: sticky;
		left: 0;
		z-index: 1;
		min-width: 10rem;
		max-width: 16rem;
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

	/* Nome dell'esame in serif, come nel libretto */
	.admin-table tbody th {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		overflow-wrap: anywhere;
	}

	.admin-table td {
		white-space: nowrap;
	}

	.admin-table .is-number {
		text-align: end;
		font-variant-numeric: lining-nums tabular-nums;
	}

	.admin-table tbody .is-number {
		font-family: var(--font-display);
		font-weight: var(--weight-semibold);
	}

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

	.admin-table-muted {
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
	}

	@media (min-width: 48rem) {
		.admin-table tr > :first-child {
			max-width: 22rem;
		}
	}

	@media (forced-colors: active) {
		.admin-table tr > :first-child {
			border-right: 3px double CanvasText;
		}
	}
</style>
