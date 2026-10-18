<script>
	import { resolve } from '$app/paths';
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { formatMonth, parseMonth, shiftMonth } from '#lib/calendar.js';
	import CalendarMonth from '#lib/components/CalendarMonth.svelte';
	import ExamPicker from '#lib/components/ExamPicker.svelte';
	import Modal from '#lib/components/Modal.svelte';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const t = getT();
	const monthYear = getDateFormat({ month: 'long', year: 'numeric' });

	let month = $derived(
		/** @type {import('#lib/calendar.js').YearMonth} */ (parseMonth(data.month))
	);
	let monthLabel = $derived(monthYear(new Date(Date.UTC(month.year, month.month - 1, 1))));

	const calendarPath = resolve('/dashboard/calendar');
	/** @param {number} delta */
	const monthHref = (delta) => `${calendarPath}?month=${formatMonth(shiftMonth(month, delta))}`;

	// Esami dell'utente fissati nel mese mostrato, per giorno
	let examsByDate = $derived.by(() => {
		/** @type {Record<string, { id: number, name: string, cfu: number }[]>} */
		const map = {};
		for (const exam of data.catalog) {
			if (!exam.plannedDate?.startsWith(data.month)) continue;
			(map[exam.plannedDate] ??= []).push(exam);
		}
		return map;
	});

	let dialogOpen = $state(false);
	/** @type {string | null} */
	let selectedDate = $state(null);

	/** @param {string} date */
	function openDay(date) {
		selectedDate = date;
		dialogOpen = true;
	}
</script>

<svelte:head>
	<title>{t('meta.calendarTitle')}: {monthLabel} - {t('meta.appName')}</title>
</svelte:head>

<section class="calendar">
	<header class="calendar-header">
		<h1 class="calendar-title">{t('calendar.title')}</h1>
		<p class="calendar-intro">{t('calendar.intro')}</p>
	</header>

	<div class="calendar-toolbar">
		<h2 class="calendar-month" id="calendar-month">{monthLabel}</h2>
		<nav class="calendar-nav" aria-label={t('calendar.nav.label')}>
			<!-- eslint-disable svelte/no-navigation-without-resolve -- percorso gia' risolto, si aggiunge solo ?month -->
			<a class="button button-secondary" href={monthHref(-1)} data-sveltekit-reset="false">
				{t('calendar.nav.previous')}
			</a>
			<a class="button button-secondary" href={calendarPath} data-sveltekit-reset="false">
				{t('calendar.nav.today')}
			</a>
			<a class="button button-secondary" href={monthHref(1)} data-sveltekit-reset="false">
				{t('calendar.nav.next')}
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</nav>
	</div>

	<div class="calendar-sheet">
		<CalendarMonth
			{month}
			today={data.today}
			{examsByDate}
			labelledby="calendar-month"
			onselect={openDay}
		/>
	</div>
</section>

<Modal bind:open={dialogOpen} labelledby="day-dialog-title">
	{#if selectedDate}
		<ExamPicker
			date={selectedDate}
			month={data.month}
			catalog={data.catalog}
			headingId="day-dialog-title"
		/>
	{/if}
</Modal>

<style>
	.calendar {
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
		min-width: 0;
	}

	.calendar-header {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}

	/* Stessa intestazione del profilo: titolo in inchiostro, introduzione attenuata */
	.calendar-title {
		font-size: var(--text-2xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		letter-spacing: -0.01em;
		color: var(--color-ink);
	}

	.calendar-intro {
		max-width: 60ch;
		font-size: var(--text-md);
		color: var(--color-text-muted);
	}

	/*
	 * Mobile: mese sopra, tre pulsanti di pari peso sotto (precedente, oggi, successivo).
	 * Da tablet: mese a sinistra e navigazione a destra sulla stessa riga.
	 */
	.calendar-toolbar {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	/* Il mese come intestazione della pagina di agenda */
	.calendar-month {
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		color: var(--color-text);
	}

	/* "ottobre 2026" -> "Ottobre 2026", senza toccare i testi */
	.calendar-month::first-letter {
		text-transform: uppercase;
	}

	.calendar-nav {
		display: grid;
		grid-template-columns: 1fr auto 1fr;
		gap: var(--space-2);
	}

	.calendar-nav .button {
		padding-inline: var(--space-3);
		text-align: center;
	}

	/* Foglio dell'agenda: pagina con bordo e fogli impilati sotto */
	.calendar-sheet {
		min-width: 0;
		background: var(--color-paper);
		border: 1px solid var(--color-paper-edge);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow-pages);
		overflow: hidden;
	}

	@media (min-width: 40rem) {
		.calendar-toolbar {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
		}

		.calendar-month {
			font-size: var(--text-2xl);
		}

		.calendar-nav {
			display: flex;
			flex-wrap: wrap;
		}

		.calendar-sheet {
			padding: var(--space-3);
		}
	}
</style>
