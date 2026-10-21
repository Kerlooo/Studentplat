<script>
	import { getT } from '#lib/i18n/context.js';
	import { PASSWORD_MAX } from '#lib/auth-rules.js';
	import ConfirmDangerForm from './ConfirmDangerForm.svelte';
	import FormField from './FormField.svelte';

	/**
	 * Eliminazione del proprio account: conferma in due passi con la password.
	 * Agli admin si mostra solo una nota (il server rifiuta comunque l'azione).
	 *
	 * @type {{
	 * 	cancelHref: string,
	 * 	isAdmin?: boolean,
	 * 	confirming?: boolean,
	 * 	errors?: { password?: string, general?: string },
	 * }}
	 */
	let { cancelHref, isAdmin = false, confirming = false, errors = {} } = $props();

	const t = getT();

	let details = $derived([
		t('profile.delete.detailTranscript'),
		t('profile.delete.detailAttempts'),
		t('profile.delete.detailCalendar'),
		t('profile.delete.detailProfile'),
		t('profile.delete.detailCatalog')
	]);
</script>

<section class="delete-account" aria-labelledby="delete-account-title">
	<h2 class="delete-account-title" id="delete-account-title">{t('profile.delete.title')}</h2>

	{#if isAdmin}
		<p class="delete-account-text">{t('profile.delete.adminNote')}</p>
	{:else}
		<p class="delete-account-text">{t('profile.delete.text')}</p>

		{#if errors.general}
			<p class="form-error" role="alert">{t(errors.general)}</p>
		{/if}

		<ConfirmDangerForm
			action="?/deleteAccount"
			label={t('profile.delete.submit')}
			question={t('profile.delete.question')}
			{details}
			confirmLabel={t('profile.delete.confirm')}
			cancelLabel={t('profile.delete.cancel')}
			{cancelHref}
			{confirming}
		>
			{#snippet fields()}
				<FormField
					id="delete-account-password"
					name="password"
					type="password"
					label={t('profile.delete.password')}
					hint={t('profile.delete.passwordHint')}
					error={errors.password}
					autocomplete="current-password"
					maxlength={PASSWORD_MAX}
					required
				/>
			{/snippet}
		</ConfirmDangerForm>
	{/if}
</section>

<style>
	/* Ultima sezione del profilo, oltre un filetto: come .profile-import */
	.delete-account {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--space-2);
		max-width: 36rem;
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-paper-edge);
	}

	.delete-account > :global(.danger-form) {
		align-self: stretch;
		margin-top: var(--space-2);
	}

	.delete-account-title {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		color: var(--color-text);
	}

	.delete-account-text {
		max-width: 60ch;
		color: var(--color-text-muted);
	}
</style>
