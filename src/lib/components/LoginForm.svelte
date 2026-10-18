<script>
	import { enhance } from '$app/forms';
	import { getT } from '#lib/i18n/context.js';
	import FormField from './FormField.svelte';

	/**
	 * @type {{
	 * 	values?: { email?: string },
	 * 	errors?: Record<string, string>,
	 * }}
	 */
	let { values = {}, errors = {} } = $props();

	const t = getT();
	let pending = $state(false);
</script>

<form
	class="auth-form auth-form-login"
	method="POST"
	action="?/login"
	use:enhance={() => {
		pending = true;
		return async ({ update }) => {
			await update();
			pending = false;
		};
	}}
>
	<h2 class="auth-form-title">{t('auth.login.title')}</h2>

	{#if errors.general}
		<p class="form-error" role="alert">{t(errors.general)}</p>
	{/if}

	<FormField
		id="login-email"
		name="email"
		type="email"
		label={t('auth.fields.email')}
		value={values.email ?? ''}
		autocomplete="email"
		required
	/>
	<FormField
		id="login-password"
		name="password"
		type="password"
		label={t('auth.fields.password')}
		autocomplete="current-password"
		required
	/>

	<button class="button button-primary" type="submit" disabled={pending}>
		{t('auth.login.submit')}
	</button>
</form>
