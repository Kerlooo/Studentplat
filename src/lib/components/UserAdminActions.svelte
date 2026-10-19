<script>
	import { enhance } from '$app/forms';
	import { getNumberFormat, getT } from '#lib/i18n/context.js';
	import ConfirmDangerForm from './ConfirmDangerForm.svelte';

	/**
	 * Azioni dell'admin su un utente: ruolo, chiusura delle sessioni, cancellazione.
	 * Su se stessi ruolo e cancellazione non si mostrano (il server li rifiuta comunque);
	 * chiudere le proprie sessioni e' permesso e disconnette anche l'admin.
	 *
	 * @type {{
	 * 	user: import('#lib/server/admin.js').AdminUserDetail,
	 * 	isSelf: boolean,
	 * 	cancelHref: string,
	 * 	confirmDelete?: boolean,
	 * }}
	 */
	let { user, isSelf, cancelHref, confirmDelete = false } = $props();

	const t = getT();
	const number = getNumberFormat();

	let pending = $state(false);

	/** @type {import('$app/forms').SubmitFunction} */
	const submit = () => {
		pending = true;
		return async ({ update }) => {
			await update();
			pending = false;
		};
	};

	let deleteDetails = $derived([
		t('admin.user.delete.detailUserExams', { count: number(user.userExams) }),
		t('admin.user.delete.detailAttempts', { count: number(user.attempts) }),
		t('admin.user.delete.detailSessions', { count: number(user.activeSessions) }),
		t('admin.user.delete.detailCatalog')
	]);
</script>

<div class="user-admin-actions">
	<section class="user-admin-action" aria-labelledby="user-admin-role">
		<h2 class="user-admin-heading" id="user-admin-role">{t('admin.user.role.title')}</h2>
		<p class="user-admin-text">
			{t('admin.user.role.current', { role: t(`admin.roles.${user.role}`) })}
		</p>
		{#if isSelf}
			<p class="user-admin-hint">{t('admin.user.role.selfHint')}</p>
		{:else}
			<form method="POST" action="?/role" use:enhance={submit}>
				<input type="hidden" name="role" value={user.role === 'admin' ? 'user' : 'admin'} />
				<button class="button button-secondary" type="submit" disabled={pending}>
					{t(user.role === 'admin' ? 'admin.user.role.demote' : 'admin.user.role.promote')}
				</button>
			</form>
		{/if}
	</section>

	<section class="user-admin-action" aria-labelledby="user-admin-sessions">
		<h2 class="user-admin-heading" id="user-admin-sessions">{t('admin.user.sessions.title')}</h2>
		<p class="user-admin-text">
			{t('admin.user.sessions.active', { count: number(user.activeSessions) })}
		</p>
		{#if isSelf}
			<p class="user-admin-hint">{t('admin.user.sessions.selfHint')}</p>
		{/if}
		<!-- Su se stessi il server rimanda all'accesso: enhance segue il redirect e ricarica i dati -->
		<form method="POST" action="?/logoutAll" use:enhance={submit}>
			<button
				class="button button-secondary"
				type="submit"
				disabled={pending || (!isSelf && user.activeSessions === 0)}
			>
				{t('admin.user.sessions.submit')}
			</button>
		</form>
	</section>

	{#if !isSelf}
		<section class="user-admin-action is-danger" aria-labelledby="user-admin-delete">
			<h2 class="user-admin-heading" id="user-admin-delete">{t('admin.user.delete.title')}</h2>
			<p class="user-admin-text">{t('admin.user.delete.text')}</p>
			<ConfirmDangerForm
				action="?/delete"
				label={t('admin.user.delete.submit')}
				question={t('admin.user.delete.question', { email: user.email })}
				details={deleteDetails}
				confirmLabel={t('admin.user.delete.confirm')}
				cancelLabel={t('admin.confirm.cancel')}
				{cancelHref}
				confirming={confirmDelete}
			/>
		</section>
	{/if}
</div>

<style>
	/*
	 * Azioni come voci successive di un registro, separate da un filetto.
	 * La cancellazione sta per ultima, oltre una linea di taglio tratteggiata in rosso:
	 * si vede a colpo d'occhio dove iniziano le azioni che non si possono annullare.
	 */
	.user-admin-actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		max-width: 40rem;
	}

	.user-admin-action {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-3);
		min-width: 0;
	}

	.user-admin-action + .user-admin-action {
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-paper-edge);
	}

	.user-admin-action > form {
		margin: 0;
	}

	.user-admin-heading {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
	}

	.user-admin-text {
		max-width: 60ch;
	}

	.user-admin-hint {
		max-width: 60ch;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.user-admin-action.is-danger {
		margin-top: var(--space-4);
		border-top: 2px dashed var(--color-danger);
	}

	/* La conferma si allarga a tutta la voce */
	.user-admin-action.is-danger > :global(.danger-form) {
		align-self: stretch;
	}

	.is-danger .user-admin-heading {
		color: var(--color-danger);
	}
</style>
