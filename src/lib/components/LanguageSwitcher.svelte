<script>
	import { page } from '$app/state';
	import { LANGS } from '#lib/i18n/index.js';
	import { getT } from '#lib/i18n/context.js';

	/** @type {{ current: import('#lib/i18n/index.js').Lang }} */
	let { current } = $props();

	const t = getT();
</script>

<form class="lang-switcher" method="POST" action="/lang">
	<input type="hidden" name="redirectTo" value={page.url.pathname + page.url.search} />
	<span class="lang-switcher-label">{t('lang.label')}</span>
	{#each LANGS as lang (lang)}
		<button
			type="submit"
			name="lang"
			value={lang}
			class="lang-switcher-option"
			aria-pressed={lang === current}
			{lang}
			title={t(`lang.${lang}`)}
			aria-label={t(`lang.${lang}`)}
		>
			{lang.toUpperCase()}
		</button>
	{/each}
</form>

<style>
	.lang-switcher {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--text-sm);
	}

	.lang-switcher-label {
		margin-right: var(--space-2);
		color: var(--color-text-muted);
	}

	.lang-switcher-option {
		min-width: 2.75rem;
		min-height: 2.75rem;
		padding: 0 var(--space-2);
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--color-text-muted);
		font-weight: var(--weight-bold);
		letter-spacing: 0.02em;
		cursor: pointer;
		transition:
			background-color var(--duration-fast) ease,
			color var(--duration-fast) ease;
	}

	.lang-switcher-option:hover {
		color: var(--color-ink);
		border-color: var(--color-paper-edge);
	}

	.lang-switcher-option[aria-pressed='true'] {
		background: var(--color-ink-soft);
		color: var(--color-ink);
		border-color: var(--color-ink);
	}
</style>
