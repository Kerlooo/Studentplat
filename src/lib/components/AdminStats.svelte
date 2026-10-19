<script>
	import { getNumberFormat, getT } from '#lib/i18n/context.js';

	/**
	 * Statistiche generali del sito: numero grande e descrizione per ciascuna.
	 * @type {{ stats: Awaited<ReturnType<typeof import('#lib/server/admin.js').getSiteStats>> }}
	 */
	let { stats } = $props();

	const t = getT();
	const number = getNumberFormat();

	let rows = $derived([
		{ key: 'users', value: stats.users },
		{ key: 'newUsers', value: stats.newUsers },
		{ key: 'admins', value: stats.admins },
		{ key: 'exams', value: stats.exams },
		{ key: 'userExams', value: stats.userExams },
		{ key: 'attempts', value: stats.attempts }
	]);
</script>

<div class="admin-stats-sheet paper-sheet">
	<dl class="admin-stats">
		{#each rows as row (row.key)}
			<div class="admin-stat">
				<dt class="admin-stat-label">{t(`admin.stats.${row.key}`)}</dt>
				<dd class="admin-stat-value">{number(row.value)}</dd>
			</div>
		{/each}
	</dl>
</div>

<style>
	/*
	 * Pagina dei totali del registro: un solo foglio col doppio margine,
	 * ogni numero scritto in inchiostro sulla propria riga, la descrizione sotto.
	 * Le colonne dipendono dalla larghezza del foglio (container), non della finestra.
	 *
	 *  ||  128              ||  128         12          3
	 *  ||  Utenti registrati||  Utenti      Nuovi       Amministratori
	 *  ||  ---------------- ||  ----------  ----------  ----------
	 */
	.admin-stats-sheet {
		container: admin-stats / inline-size;
		min-width: 0;
		padding: var(--space-2) var(--space-5) var(--space-4) calc(var(--margin-x) + var(--space-5));
	}

	.admin-stats {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		column-gap: var(--space-8);
		margin: 0;
	}

	.admin-stat {
		display: flex;
		flex-direction: column-reverse;
		justify-content: flex-end;
		gap: var(--space-1);
		min-width: 0;
		padding-block: var(--space-4) var(--space-3);
		border-bottom: 1px solid var(--color-rule);
	}

	.admin-stat-label {
		max-width: 30ch;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.admin-stat-value {
		margin: 0;
		font-family: var(--font-display);
		font-size: var(--text-2xl);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		line-height: var(--leading-tight);
		color: var(--color-ink);
	}

	@container admin-stats (min-width: 26rem) {
		.admin-stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@container admin-stats (min-width: 40rem) {
		.admin-stats {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.admin-stat-value {
			font-size: var(--text-3xl);
		}
	}
</style>
