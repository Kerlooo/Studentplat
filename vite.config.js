import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			// Content Security Policy: SvelteKit aggiunge nonce (pagine dinamiche) o hash
			// (prerender) agli script e agli stili inline che genera
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					// i fogli di stile dei font arrivano da Google Fonts (src/app.html)
					'style-src': ['self', 'https://fonts.googleapis.com'],
					// attributi style inline: il wrapper di app.html e le variabili CSS
					// passate con `style:` (es. DistributionBars)
					'style-src-attr': ['unsafe-inline'],
					'img-src': ['self', 'data:'],
					'font-src': ['self', 'https://fonts.gstatic.com'],
					'connect-src': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none'],
					'base-uri': ['self'],
					'object-src': ['none']
				}
			}
		})
	]
});
