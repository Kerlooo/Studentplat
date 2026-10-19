<script>
	import { resolve } from '$app/paths';
	import { getDateFormat, getNumberFormat, getT } from '#lib/i18n/context.js';
	import { ADMIN_TIME_ZONE } from '#lib/admin-rules.js';
	import UserAdminActions from '#lib/components/UserAdminActions.svelte';

	/** @type {import('./$types').PageProps} */
	let { data, form } = $props();

	const t = getT();
	const number = getNumberFormat();
	const dateTime = getDateFormat({
		dateStyle: 'long',
		timeStyle: 'short',
		timeZone: ADMIN_TIME_ZONE
	});

	/** @param {string | null} value */
	const formatWhen = (value) => (value ? dateTime(new Date(value)) : t('admin.users.never'));

	let user = $derived(data.user);
	let pagePath = $derived(resolve('/admin/users/[id]', { id: String(data.user.id) }));

	let pageError = $derived(form && 'error' in form && form.error ? t(form.error) : null);
	let notice = $derived.by(() => {
		if (!form || !('action' in form)) return null;
		if (form.action === 'role' && 'role' in form)
			return t('admin.user.role.saved', { role: t(`admin.roles.${form.role}`) });
		if (form.action === 'logoutAll' && 'closed' in form)
			return t('admin.user.sessions.closed', { count: number(form.closed ?? 0) });
		return null;
	});
	let confirmDelete = $derived(!!form && 'action' in form && form.action === 'confirmDelete');

	let details = $derived([
		{ key: 'name', value: user.name },
		{ key: 'nickname', value: user.nickname },
		{ key: 'degreeCourse', value: user.degreeCourse },
		{ key: 'university', value: user.university },
		{ key: 'totalCfu', value: user.totalCfu === null ? null : number(user.totalCfu) },
		{ key: 'createdAt', value: formatWhen(user.createdAt) },
		{ key: 'lastLoginAt', value: formatWhen(user.lastLoginAt) },
		{ key: 'userExams', value: number(user.userExams) },
		{ key: 'attempts', value: number(user.attempts) },
		{ key: 'activeSessions', value: number(user.activeSessions) }
	]);
</script>

<svelte:head>
	<title>{user.email} - {t('admin.meta.users')} - {t('meta.appName')}</title>
</svelte:head>

<section class="admin-page">
	<header class="admin-page-header">
		<a class="admin-page-back" href={resolve('/admin/users')}>{t('admin.user.back')}</a>
		<h1 class="admin-page-title">{user.email}</h1>
		<p class="admin-page-intro">
			{data.isSelf
				? t('admin.user.roleSelf', { role: t(`admin.roles.${user.role}`) })
				: t(`admin.roles.${user.role}`)}
		</p>
	</header>

	{#if pageError}
		<p class="form-error" role="alert">{pageError}</p>
	{/if}
	{#if notice}
		<p class="admin-page-notice" role="status">{notice}</p>
	{/if}

	<dl class="admin-details paper-sheet">
		{#each details as row (row.key)}
			<div class="admin-detail">
				<dt>{t(`admin.user.fields.${row.key}`)}</dt>
				<dd>{row.value ?? t('admin.user.empty')}</dd>
			</div>
		{/each}
	</dl>

	<UserAdminActions {user} isSelf={data.isSelf} cancelHref={pagePath} {confirmDelete} />
</section>

<style>
	.admin-page,
	.admin-page-header {
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

	/* Ritorno all'elenco: freccia verso sinistra, come in AdminNav */
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

	.admin-page-intro {
		max-width: 60ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.admin-page-notice {
		max-width: 40rem;
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--color-ink);
		border-radius: var(--radius-xs);
		background: var(--color-ink-soft);
		font-weight: var(--weight-semibold);
		animation: notice-in var(--duration-mark) var(--ease-out);
	}

	@keyframes notice-in {
		from {
			opacity: 0;
			transform: translateY(-0.25rem);
		}
	}

	/*
	 * Scheda dell'utente: foglio col doppio margine, ogni dato su una riga del foglio
	 * (descrizione piccola sopra, valore sotto). Le colonne si aggiungono con lo spazio.
	 */
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

	@media (prefers-reduced-motion: reduce) {
		.admin-page-notice {
			animation: none;
		}
	}
</style>
