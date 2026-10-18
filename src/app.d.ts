// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface User {
			id: number;
			email: string;
			name: string;
		}
		// interface Error {}
		interface Locals {
			user: User | null;
			lang: import('#lib/i18n/index.js').Lang;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
