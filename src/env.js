import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Variabile opzionale con valore di default.
 * @param {string} fallback
 */
const optional = (fallback) => (/** @type {string | undefined} */ value) => value || fallback;

export const variables = defineEnvVars({
	DB_HOST: { schema: optional('localhost'), description: 'Host del server MySQL' },
	DB_PORT: {
		schema: (value) => {
			const port = Number(value || 3306);
			if (!Number.isInteger(port)) throw new Error('DB_PORT deve essere un intero');
			return port;
		},
		description: 'Porta del server MySQL'
	},
	DB_USER: { description: 'Utente MySQL' },
	DB_PASSWORD: {
		schema: (value) => value || undefined,
		description: 'Password MySQL (vuota se assente)'
	},
	DB_NAME: { schema: optional('studentplat'), description: 'Nome del database' }
});
