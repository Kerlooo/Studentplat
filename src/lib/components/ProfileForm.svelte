<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import { NAME_MAX } from '#lib/auth-rules.js';
	import {
		DEGREE_COURSE_MAX,
		NICKNAME_MAX,
		TOTAL_CFU_MAX,
		TOTAL_CFU_MIN,
		UNIVERSITY_MAX
	} from '#lib/profile-rules.js';
	import FormField from './FormField.svelte';

	/**
	 * @type {{
	 * 	values: {
	 * 		name: string,
	 * 		nickname: string,
	 * 		degreeCourse: string,
	 * 		university: string,
	 * 		totalCfu: string,
	 * 	},
	 * 	errors?: Record<string, string>,
	 * 	saved?: boolean,
	 * }}
	 */
	let { values, errors = {}, saved = false } = $props();

	const t = getT();
	let pending = $state(false);

	const cfuRange = { min: TOTAL_CFU_MIN, max: TOTAL_CFU_MAX };
</script>

<form
	class="profile-form"
	method="POST"
	action="?/save"
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			// niente reset: i campi restano con i valori appena salvati
			await update({ reset: false });
			pending = false;
		};
	}}
>
	{#if errors.general}
		<p class="form-error" role="alert">{t(errors.general)}</p>
	{/if}

	<fieldset class="profile-form-group">
		<legend class="profile-form-legend">{t('profile.sections.personal')}</legend>
		<FormField
			id="profile-name"
			name="name"
			label={t('profile.fields.name')}
			value={values.name}
			error={errors.name}
			errorParams={{ max: NAME_MAX }}
			autocomplete="name"
			maxlength={NAME_MAX}
			required
		/>
		<FormField
			id="profile-nickname"
			name="nickname"
			label={t('profile.fields.nickname')}
			hint={t('profile.hints.nickname')}
			value={values.nickname}
			error={errors.nickname}
			errorParams={{ max: NICKNAME_MAX }}
			autocomplete="nickname"
			maxlength={NICKNAME_MAX}
		/>
	</fieldset>

	<fieldset class="profile-form-group">
		<legend class="profile-form-legend">{t('profile.sections.studies')}</legend>
		<FormField
			id="profile-degree-course"
			name="degreeCourse"
			label={t('profile.fields.degreeCourse')}
			value={values.degreeCourse}
			error={errors.degreeCourse}
			errorParams={{ max: DEGREE_COURSE_MAX }}
			autocomplete="off"
			maxlength={DEGREE_COURSE_MAX}
		/>
		<FormField
			id="profile-university"
			name="university"
			label={t('profile.fields.university')}
			value={values.university}
			error={errors.university}
			errorParams={{ max: UNIVERSITY_MAX }}
			autocomplete="organization"
			maxlength={UNIVERSITY_MAX}
		/>
		<FormField
			id="profile-total-cfu"
			name="totalCfu"
			type="number"
			inputmode="numeric"
			label={t('profile.fields.totalCfu')}
			hint={t('profile.hints.totalCfu', cfuRange)}
			value={values.totalCfu}
			error={errors.totalCfu}
			errorParams={cfuRange}
			min={TOTAL_CFU_MIN}
			max={TOTAL_CFU_MAX}
			step="1"
		/>
	</fieldset>

	<div class="profile-form-actions">
		<button class="button button-primary" type="submit" disabled={pending}>
			{t('profile.submit')}
		</button>
		<p class="profile-form-status" role="status">
			{#if saved && !pending}<span class="profile-form-stamp">{t('profile.saved')}</span>{/if}
		</p>
	</div>
</form>

<style>
	.profile-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
	}

	.profile-form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-5);
		margin: 0;
		padding: 0;
		border: 0;
		min-width: 0;
	}

	/*
	 * Intestazione di sezione del libretto. Il float toglie alla legend la
	 * posizione speciale sul bordo del fieldset: diventa un elemento del flex
	 * come gli altri, a tutta larghezza, con il filetto sotto.
	 */
	.profile-form-legend {
		float: left;
		width: 100%;
		margin: 0;
		padding: 0 0 var(--space-2);
		border-bottom: 1px solid var(--color-paper-edge);
		font-family: var(--font-display);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		color: var(--color-ink);
	}

	.profile-form-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-4) var(--space-6);
		padding-top: var(--space-2);
	}

	.profile-form-status {
		min-width: 0;
	}

	/*
	 * Conferma di salvataggio come timbro della segreteria: cornice doppia
	 * in inchiostro, leggermente storta. Compare con una pressione breve,
	 * l'unico movimento del form, perche' risponde all'azione di salvare.
	 */
	.profile-form-stamp {
		display: inline-block;
		padding: var(--space-1) var(--space-3);
		border: 3px double var(--color-ink);
		border-radius: var(--radius-sm);
		color: var(--color-ink);
		font-weight: var(--weight-bold);
		line-height: var(--leading-snug);
		transform: rotate(-2deg);
		animation: stamp-press var(--duration-mark) var(--ease-out);
	}

	@keyframes stamp-press {
		from {
			opacity: 0;
			transform: rotate(-2deg) scale(1.25);
		}
		to {
			opacity: 1;
			transform: rotate(-2deg) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.profile-form-stamp {
			animation: none;
		}
	}
</style>
