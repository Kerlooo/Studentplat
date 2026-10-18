<script>
	import { getT } from '#lib/i18n/context.js';
	import ProfileForm from '#lib/components/ProfileForm.svelte';

	/** @type {import('./$types').PageProps} */
	let { data, form } = $props();

	const t = getT();

	// Dopo un errore si rimostrano i valori inviati, altrimenti quelli salvati
	let values = $derived(
		(form && 'values' in form ? form.values : undefined) ?? {
			name: data.profile.name,
			nickname: data.profile.nickname ?? '',
			degreeCourse: data.profile.degreeCourse ?? '',
			university: data.profile.university ?? '',
			totalCfu: data.profile.totalCfu == null ? '' : String(data.profile.totalCfu)
		}
	);
</script>

<svelte:head>
	<title>{t('meta.profileTitle')} - {t('meta.appName')}</title>
</svelte:head>

<section class="profile">
	<header class="profile-header">
		<h1 class="profile-title">{t('profile.title')}</h1>
		<p class="profile-intro">{t('profile.intro')}</p>
	</header>

	<div class="profile-panel paper-ruled">
		<ProfileForm
			{values}
			errors={form && 'errors' in form ? form.errors : undefined}
			saved={!!(form && 'saved' in form && form.saved)}
		/>
	</div>
</section>

<style>
	.profile {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.profile-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	.profile-title {
		font-weight: var(--weight-bold);
		letter-spacing: -0.01em;
		font-size: var(--text-2xl);
		line-height: var(--leading-tight);
		color: var(--color-ink);
	}

	.profile-intro {
		max-width: 60ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	.profile-panel {
		width: 100%;
		max-width: 36rem;
		padding: var(--space-5) var(--space-5) var(--space-8) var(--space-8);
	}

	@media (min-width: 30rem) {
		.profile-panel {
			padding: var(--space-6) var(--space-8) var(--space-10) var(--space-12);
		}
	}
</style>
