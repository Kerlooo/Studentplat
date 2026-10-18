<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import { EMAIL_MAX, NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from '#lib/auth-rules.js';
	import FormField from './FormField.svelte';

	/**
	 * @type {{
	 * 	values?: { name?: string, email?: string },
	 * 	errors?: Record<string, string>,
	 * }}
	 */
	let { values = {}, errors = {} } = $props();

	const t = getT();
	let pending = $state(false);

	const errorParams = { min: PASSWORD_MIN, max: PASSWORD_MAX };
</script>

<form
	class="auth-form auth-form-register"
	method="POST"
	action="?/register"
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			await update();
			pending = false;
		};
	}}
>
	<h2 class="auth-form-title">{t('auth.register.title')}</h2>

	{#if errors.general}
		<p class="form-error" role="alert">{t(errors.general)}</p>
	{/if}

	<FormField
		id="register-name"
		name="name"
		label={t('auth.fields.name')}
		value={values.name ?? ''}
		error={errors.name}
		errorParams={{ max: NAME_MAX }}
		autocomplete="name"
		maxlength={NAME_MAX}
		required
	/>
	<FormField
		id="register-email"
		name="email"
		type="email"
		label={t('auth.fields.email')}
		value={values.email ?? ''}
		error={errors.email}
		autocomplete="email"
		maxlength={EMAIL_MAX}
		required
	/>
	<FormField
		id="register-password"
		name="password"
		type="password"
		label={t('auth.fields.password')}
		hint={t('auth.hints.passwordMin', { min: PASSWORD_MIN })}
		error={errors.password}
		{errorParams}
		autocomplete="new-password"
		minlength={PASSWORD_MIN}
		maxlength={PASSWORD_MAX}
		required
	/>
	<FormField
		id="register-password-confirm"
		name="passwordConfirm"
		type="password"
		label={t('auth.fields.passwordConfirm')}
		error={errors.passwordConfirm}
		autocomplete="new-password"
		minlength={PASSWORD_MIN}
		maxlength={PASSWORD_MAX}
		required
	/>

	<button class="button button-primary" type="submit" disabled={pending}>
		{t('auth.register.submit')}
	</button>
</form>
