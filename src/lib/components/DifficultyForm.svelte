<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import DifficultySelect from './DifficultySelect.svelte';

	/**
	 * Difficolta' personale di un esame del libretto ("Non indicata" la toglie).
	 * @type {{
	 * 	userExamId: number,
	 * 	value: string | null,
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
	class="difficulty-form"
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
	<DifficultySelect id="{idPrefix}-difficulty" {value} hint={t('difficulty.hint')} {error} />
	<div class="difficulty-form-actions">
		<button class="button button-secondary" type="submit" disabled={pending}>
			{t('difficulty.submit')}
		</button>
		<p class="difficulty-form-status" role="status">
			{#if saved && !pending}{t('difficulty.saved')}{/if}
		</p>
	</div>
</form>

<style>
	/* Come TeacherForm */
	.difficulty-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		max-width: 28rem;
		margin: 0;
	}

	.difficulty-form-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-4);
	}

	.difficulty-form-actions .button {
		padding-inline: var(--space-4);
		background: var(--color-paper);
	}

	.difficulty-form-actions .button:hover:not(:disabled) {
		background: var(--color-ink-soft);
	}

	/* "Difficolta' salvata.": conferma breve in inchiostro accanto al pulsante */
	.difficulty-form-status {
		font-weight: var(--weight-semibold);
		color: var(--color-ink);
	}
</style>
