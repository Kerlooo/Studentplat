<script>
	import { getT } from '#lib/i18n/context.js';
	import ProfileForm from '#lib/components/ProfileForm.svelte';
	import ExamImportForm from '#lib/components/ExamImportForm.svelte';

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

	<div class="profile-panel profile-import">
		<ExamImportForm
			initialText={form && 'importText' in form ? form.importText : ''}
			errors={form && 'importErrors' in form ? form.importErrors : []}
			result={form && 'imported' in form ? form.imported : null}
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

	/*
	 * Importazione: stesso foglio del profilo con il doppio margine rosso,
	 * ma senza righe (il codice non sta sulle righe della pagina).
	 */
	.profile-import {
		--margin-x: var(--space-4);
		min-width: 0;
		background-color: var(--color-paper);
		background-image: linear-gradient(
			to right,
			transparent var(--margin-x),
			var(--color-margin) var(--margin-x),
			var(--color-margin) calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 1px),
			transparent calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 4px),
			var(--color-margin) calc(var(--margin-x) + 5px),
			transparent calc(var(--margin-x) + 5px)
		);
		border: 1px solid var(--color-paper-edge);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-pages);
	}

	@media (min-width: 30rem) {
		.profile-panel {
			padding: var(--space-6) var(--space-8) var(--space-10) var(--space-12);
		}

		.profile-import {
			--margin-x: var(--space-8);
		}
	}
</style>
