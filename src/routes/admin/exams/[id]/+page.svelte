<script>
	import { resolve } from '$app/paths';
	import { getDateFormat, getNumberFormat, getT } from '#lib/i18n/context.js';
	import { ADMIN_TIME_ZONE } from '#lib/admin-rules.js';
	import ConfirmDangerForm from '#lib/components/ConfirmDangerForm.svelte';
	import ExamAdminForm from '#lib/components/ExamAdminForm.svelte';
	import ExamMergeForm from '#lib/components/ExamMergeForm.svelte';

	/** @type {import('./$types').PageProps} */
	let { data, form } = $props();

	const t = getT();
	const number = getNumberFormat();
	const dateTime = getDateFormat({
		dateStyle: 'long',
		timeStyle: 'short',
		timeZone: ADMIN_TIME_ZONE
	});

	let exam = $derived(data.exam);
	let pagePath = $derived(resolve('/admin/exams/[id]', { id: String(data.exam.id) }));

	// Dopo un errore di modifica si rimostrano i valori inviati, altrimenti quelli salvati
	let editValues = $derived(
		(form && 'values' in form ? form.values : undefined) ?? {
			name: exam.name,
			cfu: String(exam.cfu)
		}
	);
	let editErrors = $derived(
		form && 'errors' in form
			? form.errors
			: form && 'values' in form && 'error' in form && form.error
				? { general: form.error }
				: undefined
	);
	let duplicate = $derived(form && 'duplicate' in form ? form.duplicate : null);

	// Errori delle altre azioni: in cima alla pagina, con l'elenco degli utenti in conflitto
	let pageError = $derived(
		form && 'error' in form && form.error && !('values' in form) ? t(form.error) : null
	);
	/** @type {string[]} */
	let conflictEmails = $derived(
		form && 'emails' in form && Array.isArray(form.emails) ? form.emails : []
	);

	let confirmDelete = $derived(!!form && 'action' in form && form.action === 'confirmDelete');
	let confirmMerge = $derived(!!form && 'action' in form && form.action === 'confirmMerge');
	let mergeTarget = $derived(
		form && 'targetId' in form && form.targetId ? form.targetId : (duplicate?.id ?? null)
	);

	let deleteDetails = $derived([
		t('admin.exam.delete.detailUserExams', { count: number(exam.userExams) }),
		t('admin.exam.delete.detailAttempts', { count: number(exam.attempts) })
	]);
</script>

<svelte:head>
	<title>{exam.name} - {t('admin.meta.exams')} - {t('meta.appName')}</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-page-header">
		<a class="admin-page-back" href={resolve('/admin/exams')}>{t('admin.exam.back')}</a>
		<h1 class="admin-page-title">{exam.name}</h1>
		<p class="admin-page-intro">{t('calendar.cfuShort', { cfu: exam.cfu })}</p>
	</header>

	{#if pageError}
		<div class="form-error" role="alert">
			<p>{pageError}</p>
			{#if conflictEmails.length > 0}
				<ul class="admin-conflicts">
					{#each conflictEmails as email (email)}
						<li>{email}</li>
					{/each}
				</ul>
			{/if}
		</div>
	{/if}

	<dl class="admin-details paper-sheet">
		<div class="admin-detail">
			<dt>{t('admin.exam.fields.creator')}</dt>
			<dd>
				{#if exam.creator}
					<a href={resolve('/admin/users/[id]', { id: String(exam.creator.id) })}>
						{exam.creator.email}
					</a>
				{:else}
					{t('admin.exams.deletedUser')}
				{/if}
			</dd>
		</div>
		<div class="admin-detail">
			<dt>{t('admin.exam.fields.createdAt')}</dt>
			<dd>{exam.createdAt ? dateTime(new Date(exam.createdAt)) : t('admin.user.empty')}</dd>
		</div>
		<div class="admin-detail">
			<dt>{t('admin.exam.fields.userExams')}</dt>
			<dd>{number(exam.userExams)}</dd>
		</div>
		<div class="admin-detail">
			<dt>{t('admin.exam.fields.attempts')}</dt>
			<dd>{number(exam.attempts)}</dd>
		</div>
	</dl>

	<section class="admin-section" aria-labelledby="exam-edit-title">
		<h2 class="admin-section-title" id="exam-edit-title">{t('admin.exam.edit.title')}</h2>
		<ExamAdminForm
			values={editValues}
			errors={editErrors}
			{duplicate}
			saved={!!form && 'action' in form && form.action === 'edit'}
		/>
	</section>

	<section class="admin-section is-danger" aria-labelledby="exam-merge-title">
		<h2 class="admin-section-title" id="exam-merge-title">{t('admin.exam.merge.title')}</h2>
		<p class="admin-section-text">{t('admin.exam.merge.text')}</p>
		<ExamMergeForm
			{exam}
			others={data.others}
			selected={mergeTarget}
			confirming={confirmMerge}
			cancelHref={pagePath}
		/>
	</section>

	<section class="admin-section is-danger" aria-labelledby="exam-delete-title">
		<h2 class="admin-section-title" id="exam-delete-title">{t('admin.exam.delete.title')}</h2>
		<p class="admin-section-text">{t('admin.exam.delete.text')}</p>
		<ConfirmDangerForm
			action="?/delete"
			label={t('admin.exam.delete.submit')}
			question={t('admin.exam.delete.question', { name: exam.name })}
			details={deleteDetails}
			confirmLabel={t('admin.exam.delete.confirm')}
			cancelLabel={t('admin.confirm.cancel')}
			cancelHref={pagePath}
			confirming={confirmDelete}
		/>
	</section>
</section>

<style>
	.admin-page,
	.admin-page-header,
	.admin-section {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.admin-page {
		gap: var(--space-8);
	}

	.admin-page-header {
		align-items: flex-start;
		gap: var(--space-2);
	}

	/* Ritorno al catalogo: freccia verso sinistra, come in AdminNav */
	.admin-page-back {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 2.75rem;
		font-weight: var(--weight-semibold);
		color: var(--color-ink);
		text-decoration-thickness: 1px;
	}

	.admin-page-back::before {
		content: '';
		flex: none;
		width: 0.45rem;
		height: 0.45rem;
		border-left: 2px solid currentColor;
		border-bottom: 2px solid currentColor;
		transform: rotate(45deg);
	}

	.admin-page-back:hover {
		color: var(--color-ink-strong);
		text-decoration-thickness: 2px;
	}

	.admin-page-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: -0.01em;
		color: var(--color-ink);
		overflow-wrap: anywhere;
	}

	/* CFU sotto il nome, in serif con cifre tabellari come nel libretto */
	.admin-page-intro {
		font-family: var(--font-display);
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--color-text-muted);
	}

	.admin-conflicts {
		margin: var(--space-2) 0 0;
		padding-inline-start: var(--space-5);
		font-weight: var(--weight-regular);
	}

	/* Scheda dell'esame: stesso foglio della scheda utente */
	.admin-details {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 13rem), 1fr));
		column-gap: var(--space-8);
		margin: 0;
		padding: var(--space-2) var(--space-5) var(--space-4) calc(var(--margin-x) + var(--space-5));
	}

	.admin-detail {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		min-width: 0;
		padding-block: var(--space-3);
		border-bottom: 1px solid var(--color-rule);
	}

	.admin-detail dt {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.admin-detail dd {
		margin: 0;
		font-weight: var(--weight-semibold);
		overflow-wrap: anywhere;
	}

	.admin-detail a {
		color: var(--color-ink);
	}

	.admin-section {
		gap: var(--space-3);
		max-width: 40rem;
	}

	.admin-section-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
	}

	.admin-section-text {
		max-width: 60ch;
		color: var(--color-text-muted);
	}

	/*
	 * Unione ed eliminazione tolgono l'esame dal catalogo: stanno oltre una linea
	 * di taglio tratteggiata in rosso, con il titolo in rosso.
	 */
	.admin-section.is-danger {
		padding-top: var(--space-6);
		border-top: 2px dashed var(--color-danger);
	}

	.is-danger .admin-section-title {
		color: var(--color-danger);
	}

	.admin-detail a {
		text-decoration-thickness: 1px;
	}

	.admin-detail a:hover {
		color: var(--color-ink-strong);
		text-decoration-thickness: 2px;
	}
</style>
