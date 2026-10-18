<script>
	import { getT } from '#lib/i18n/context.js';

	const t = getT();
</script>

<footer class="site-footer">
	<p class="site-footer-text">{t('site.footer.text')}</p>
	<p class="site-footer-text">
		{t('site.footer.credits', { name: 'Carlo' })}
		<span aria-hidden="true">&middot;</span>
		<a class="site-footer-link" href="https://github.com/Kerlooo/Studentplat" rel="external"
			>{t('site.footer.github')}</a
		>
	</p>
</footer>

<style>
	.site-footer {
		padding-top: var(--space-6);
		border-top: 1px solid var(--color-paper-edge);
	}

	.site-footer-text {
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.site-footer-link {
		color: inherit;
		text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
		text-underline-offset: 0.2em;
	}

	.site-footer-link:hover {
		color: var(--color-ink);
		text-decoration-color: currentColor;
	}
</style>
