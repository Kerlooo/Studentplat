<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import { TEACHER_MAX } from '#lib/grade-rules.js';
	import FormField from './FormField.svelte';

	/**
	 * Docente di un esame del libretto (facoltativo: vuoto lo toglie).
	 * @type {{
	 * 	userExamId: number,
	 * 	value: string,
	 * 	action: string,
	 * 	idPrefix: string,
	 * 	error?: string,
	 * 	saved?: boolean,
	 * }}
	 */
	let { userExamId, value, action, idPrefix, error, saved = false } = $props();

	const t = getT();
	let pending = $state(false);
</script>

<form
	class="teacher-form"
	method="POST"
	{action}
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			await update({ reset: false });
			pending = false;
		};
	}}
>
	<input type="hidden" name="userExamId" value={userExamId} />
	<FormField
		id="{idPrefix}-teacher"
		name="teacher"
		label={t('transcript.teacher.label')}
		hint={t('transcript.teacher.hint')}
		{value}
		{error}
		errorParams={{ max: TEACHER_MAX }}
		maxlength={TEACHER_MAX}
		autocomplete="off"
	/>
	<div class="teacher-form-actions">
		<button class="button button-secondary" type="submit" disabled={pending}>
			{t('transcript.teacher.submit')}
		</button>
		<p class="teacher-form-status" role="status">
			{#if saved && !pending}{t('transcript.teacher.saved')}{/if}
		</p>
	</div>
</form>

<style>
	.teacher-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 28rem;
		margin: 0;
	}

	.teacher-form-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
	}

	.teacher-form-actions .button {
		padding-inline: var(--space-4);
		background: var(--color-paper);
	}

	.teacher-form-actions .button:hover:not(:disabled) {
		background: var(--color-ink-soft);
	}

	/* "Docente salvato.": conferma breve in inchiostro accanto al pulsante */
	.teacher-form-status {
		font-weight: var(--weight-semibold);
		color: var(--color-ink);
	}
</style>
