<script>
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import { getDateFormat, getT } from '#lib/i18n/context.js';
	import { isoToUtcDate } from '#lib/calendar.js';
	import { examSearchKey } from '#lib/exam-rules.js';
	import { attemptOutcome, formatGrade } from '#lib/grade-rules.js';
	import AttemptForm from './AttemptForm.svelte';
	import AttemptList from './AttemptList.svelte';
	import CreateExamForm from './CreateExamForm.svelte';

	/**
	 * Contenuto del popup di un giorno: esami del giorno (fissati o con un esito registrato)
	 * con i loro tentativi e "Registra esito", poi catalogo con ricerca e creazione.
	 * Gli esami gia' superati non si possono piu' fissare ne' registrare.
	 * Dopo ogni azione il popup resta aperto e mostra l'esito (vedi `message`).
	 *
	 * @type {{
	 * 	date: string,
	 * 	today: string,
	 * 	month: string,
	 * 	catalog: import('#lib/server/exams.js').CatalogExam[],
	 * 	attempts: import('#lib/grade-rules.js').Attempt[],
	 * 	headingId: string,
	 * }}
	 */
	let { date, today, month, catalog, attempts, headingId } = $props();

	const t = getT();
	const fullDate = getDateFormat({
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
	const shortDate = getDateFormat({ day: 'numeric', month: 'long', year: 'numeric' });

	/** @param {string} iso */
	const formatShort = (iso) => shortDate(isoToUtcDate(iso));

	/** URL dell'action che conserva il mese visualizzato (serve anche senza JavaScript). */
	const actionUrl = (/** @type {string} */ name) => `?month=${month}&/${name}`;

	let query = $state('');
	let creating = $state(false);
	/** Esame del libretto di cui e' aperto il form "Registra esito". */
	/** @type {number | null} */
	let recordingId = $state(null);
	let pending = $state(false);
	/** @type {{ kind: 'success' | 'error', text: string } | null} */
	let message = $state(null);
	/** @type {HTMLElement | undefined} */
	let messageEl = $state();
	/** @type {HTMLButtonElement | undefined} */
	let createToggle = $state();

	// Tentativi registrati in questo giorno, per esame del catalogo
	let dayAttempts = $derived.by(() => {
		/** @type {Record<number, import('#lib/grade-rules.js').Attempt[]>} */
		const byExam = {};
		for (const attempt of attempts) {
			if (attempt.date === date) (byExam[attempt.examId] ??= []).push(attempt);
		}
		return byExam;
	});
	// Esami del giorno: fissati qui oppure con un esito registrato qui
	let scheduled = $derived(
		catalog.filter((exam) => exam.plannedDate === date || exam.id in dayAttempts)
	);
	let canRecord = $derived(date <= today);
	let searchKey = $derived(examSearchKey(query));
	let matches = $derived(
		searchKey ? catalog.filter((exam) => examSearchKey(exam.name).includes(searchKey)) : catalog
	);
	// Quelli del giorno stanno nella sezione sopra
	let available = $derived(matches.filter((exam) => !scheduled.includes(exam)));

	/** @param {NonNullable<import('#lib/server/exams.js').CatalogExam['passed']>} passed */
	const passedText = (passed) =>
		t('calendar.picker.passedOn', {
			date: formatShort(passed.date),
			grade: /** @type {string} */ (formatGrade(passed.grade, t('grades.lode')))
		});

	/**
	 * Testo di esito della registrazione di un tentativo.
	 * @param {Record<string, any>} data
	 */
	function describeAttempt(data) {
		const outcome = attemptOutcome({ grade: data.grade, rejected: !!data.rejected });
		const grade = formatGrade(data.grade, t('grades.lode')) ?? '';
		return t(`calendar.messages.attempt.${outcome}`, { name: data.exam.name, grade });
	}

	/**
	 * Testo di esito di add/create a partire dalla risposta dell'action.
	 * @param {Record<string, any>} data
	 */
	function describeSchedule(data) {
		const name = data.exam.name;
		const parts = [];
		if (data.action === 'create' && !data.reused) {
			parts.push(t('calendar.messages.created', { name }));
		} else {
			if (data.reused) parts.push(t('calendar.messages.reused', { name, cfu: data.exam.cfu }));
			if (data.status === 'moved' && data.previousDate)
				parts.push(t('calendar.messages.moved', { name, from: formatShort(data.previousDate) }));
			else if (data.status === 'moved') parts.push(t('calendar.messages.movedUndated', { name }));
			else if (data.status === 'unchanged') parts.push(t('calendar.messages.unchanged', { name }));
			else parts.push(t('calendar.messages.added', { name }));
		}
		return parts.join(' ');
	}

	/** Porta il focus sull'esito, cosi' viene letto e non si perde dentro il popup. */
	async function showMessage(/** @type {NonNullable<typeof message>} */ next) {
		message = next;
		await tick();
		messageEl?.focus();
	}

	/**
	 * Gestione comune di add e unschedule: aggiorna i dati senza cambiare pagina.
	 * @param {(data: Record<string, any>) => string} describe
	 * @returns {import('$app/forms').SubmitFunction}
	 */
	const submitWith = (describe) => () => {
		pending = true;
		return async ({ result, update }) => {
			await update({ reset: false, navigate: false });
			pending = false;
			if (result.type === 'success' && result.data) {
				await showMessage({ kind: 'success', text: describe(result.data) });
			} else if (result.type === 'failure') {
				await showMessage({
					kind: 'error',
					text: t(result.data?.error ?? 'calendar.errors.generic', result.data?.params)
				});
			} else if (result.type === 'error') {
				await showMessage({ kind: 'error', text: t('calendar.errors.generic') });
			}
		};
	};

	/** @param {Record<string, any>} data */
	async function handleCreated(data) {
		creating = false;
		query = '';
		await showMessage({ kind: 'success', text: describeSchedule(data) });
	}

	/** @param {Record<string, any>} data */
	async function handleRecorded(data) {
		recordingId = null;
		await showMessage({ kind: 'success', text: describeAttempt(data) });
	}

	/** @param {number} userExamId */
	async function toggleRecord(userExamId) {
		recordingId = recordingId === userExamId ? null : userExamId;
		if (recordingId === null) return;
		await tick();
		document.getElementById(`${headingId}-attempt-${userExamId}-grade`)?.focus();
	}

	/** @param {number} userExamId */
	async function cancelRecord(userExamId) {
		recordingId = null;
		await tick();
		document.getElementById(`${headingId}-record-${userExamId}`)?.focus();
	}

	async function toggleCreate() {
		creating = !creating;
		if (!creating) return;
		await tick();
		document.getElementById('create-exam-name')?.focus();
	}

	async function cancelCreate() {
		creating = false;
		await tick();
		createToggle?.focus();
	}
</script>

<div class="exam-picker">
	<h2 class="exam-picker-title" id={headingId}>{fullDate(isoToUtcDate(date))}</h2>

	{#if message}
		<p
			class="exam-picker-message"
			class:is-error={message.kind === 'error'}
			tabindex="-1"
			bind:this={messageEl}
		>
			{message.text}
		</p>
	{/if}

	<section class="exam-picker-section" aria-labelledby="{headingId}-scheduled">
		<h3 class="exam-picker-heading" id="{headingId}-scheduled">{t('calendar.picker.scheduled')}</h3>
		{#if scheduled.length > 0}
			<ul class="exam-list">
				{#each scheduled as exam (exam.id)}
					{@const examAttempts = dayAttempts[exam.id] ?? []}
					<li class="exam-list-item" class:is-passed={!!exam.passed}>
						<span class="exam-list-name">{exam.name}</span>
						<span class="exam-list-cfu">{t('calendar.cfuShort', { cfu: exam.cfu })}</span>
						<!-- Superato in un altro giorno: lo si dice qui; se e' oggi lo mostra gia' l'elenco degli esiti -->
						{#if exam.passed && exam.passed.date !== date}
							<span class="exam-list-status">{passedText(exam.passed)}</span>
						{/if}

						{#if examAttempts.length > 0}
							<div class="exam-list-attempts">
								<AttemptList
									attempts={examAttempts}
									showDate={false}
									label={t('calendar.picker.attemptsLabel', { name: exam.name })}
								/>
							</div>
						{/if}

						{#if !exam.passed && exam.userExamId !== null}
							{@const userExamId = exam.userExamId}
							<div class="exam-list-actions">
								{#if canRecord}
									<button
										class="button button-primary"
										type="button"
										id="{headingId}-record-{userExamId}"
										aria-expanded={recordingId === userExamId}
										aria-controls="{headingId}-attempt-{userExamId}"
										aria-label={t('calendar.picker.recordLabel', { name: exam.name })}
										onclick={() => toggleRecord(userExamId)}
									>
										{t('calendar.picker.record')}
									</button>
								{/if}
								{#if exam.plannedDate === date}
									<form
										class="exam-list-action"
										method="POST"
										action={actionUrl('unschedule')}
										use:enhance={submitWith(() =>
											t('calendar.messages.removed', { name: exam.name })
										)}
									>
										<input type="hidden" name="userExamId" value={userExamId} />
										<button
											class="button button-secondary"
											type="submit"
											disabled={pending}
											aria-label={t('calendar.picker.unscheduleLabel', { name: exam.name })}
										>
											{t('calendar.picker.unschedule')}
										</button>
									</form>
								{/if}
							</div>
							{#if !canRecord}
								<p class="exam-list-status">{t('calendar.picker.recordLater')}</p>
							{/if}
							<div class="exam-list-record" id="{headingId}-attempt-{userExamId}">
								{#if recordingId === userExamId}
									<AttemptForm
										{userExamId}
										examName={exam.name}
										{date}
										action={actionUrl('attempt')}
										idPrefix="{headingId}-attempt-{userExamId}"
										onsuccess={handleRecorded}
										oncancel={() => cancelRecord(userExamId)}
									/>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{:else}
			<p class="exam-picker-empty">{t('calendar.picker.noneScheduled')}</p>
		{/if}
	</section>

	<section class="exam-picker-section" aria-labelledby="{headingId}-catalog">
		<h3 class="exam-picker-heading" id="{headingId}-catalog">{t('calendar.picker.catalog')}</h3>
		<p class="exam-picker-hint">{t('calendar.picker.catalogHint')}</p>

		<div class="exam-search" role="search">
			<label class="exam-search-label" for="{headingId}-search">{t('calendar.picker.search')}</label
			>
			<input
				class="exam-search-input"
				id="{headingId}-search"
				type="search"
				autocomplete="off"
				bind:value={query}
			/>
		</div>
		<p class="visually-hidden" role="status">
			{#if searchKey}{t('calendar.picker.results', { count: available.length })}{/if}
		</p>

		{#if available.length > 0}
			<ul class="exam-list exam-list-catalog">
				{#each available as exam (exam.id)}
					<li class="exam-list-item">
						<span class="exam-list-name">{exam.name}</span>
						<span class="exam-list-cfu">{t('calendar.cfuShort', { cfu: exam.cfu })}</span>
						{#if exam.passed}
							<span class="exam-list-status" id="{headingId}-passed-{exam.id}">
								{passedText(exam.passed)}
							</span>
						{:else if exam.userExamId !== null}
							<span class="exam-list-status">
								{exam.plannedDate
									? t('calendar.picker.inTranscriptOn', { date: formatShort(exam.plannedDate) })
									: t('calendar.picker.inTranscript')}
							</span>
						{/if}
						<form
							class="exam-list-action"
							method="POST"
							action={actionUrl('add')}
							use:enhance={submitWith(describeSchedule)}
						>
							<input type="hidden" name="date" value={date} />
							<input type="hidden" name="examId" value={exam.id} />
							{#if exam.passed}
								<!-- Esame superato: azione disattivata, il motivo e' nello stato sopra -->
								<button
									class="button button-secondary"
									type="submit"
									disabled
									aria-describedby="{headingId}-passed-{exam.id}"
								>
									{t('calendar.picker.add')}
								</button>
							{:else if exam.plannedDate}
								<button
									class="button button-secondary"
									type="submit"
									disabled={pending}
									aria-label={t('calendar.picker.moveLabel', { name: exam.name })}
								>
									{t('calendar.picker.move')}
								</button>
							{:else}
								<button
									class="button button-secondary"
									type="submit"
									disabled={pending}
									aria-label={t('calendar.picker.addLabel', { name: exam.name })}
								>
									{t('calendar.picker.add')}
								</button>
							{/if}
						</form>
					</li>
				{/each}
			</ul>
		{:else if matches.length > 0}
			<p class="exam-picker-empty">{t('calendar.picker.onlyScheduled')}</p>
		{:else if searchKey}
			<p class="exam-picker-empty">{t('calendar.picker.noResults', { query: query.trim() })}</p>
		{:else if catalog.length === 0}
			<p class="exam-picker-empty">{t('calendar.picker.catalogEmpty')}</p>
		{/if}
	</section>

	<section class="exam-picker-section exam-picker-create">
		<button
			class="button button-primary"
			type="button"
			aria-expanded={creating}
			aria-controls="{headingId}-create"
			bind:this={createToggle}
			onclick={toggleCreate}
		>
			{t('calendar.create.open')}
		</button>
		<div id="{headingId}-create">
			{#if creating}
				<CreateExamForm
					{date}
					{catalog}
					action={actionUrl('create')}
					initialName={query}
					onsuccess={handleCreated}
					oncancel={cancelCreate}
				/>
			{/if}
		</div>
	</section>
</div>

<style>
	/*
	 * Pagina del giorno nel libretto: data come intestazione, poi le sezioni
	 * separate da una riga della pagina. Gli esami fissati riprendono l'etichetta
	 * d'inchiostro del calendario; il catalogo e' un elenco a righe.
	 */
	/*
	 * Flusso a blocchi, non flex: il pulsante "Chiudi" del Modal e' in float e cosi'
	 * scorre accanto al solo titolo; esito e sezioni ripartono sotto (clear).
	 */
	.exam-picker {
		display: block;
		min-width: 0;
	}

	.exam-picker > * + * {
		margin-top: var(--space-6);
	}

	.exam-picker-title {
		padding-top: var(--space-1);
		font-size: var(--text-xl);
		font-weight: var(--weight-bold);
		line-height: var(--leading-tight);
		color: var(--color-ink);
	}

	/* "sabato 18 ottobre 2026" -> "Sabato 18 ottobre 2026" */
	.exam-picker-title::first-letter {
		text-transform: uppercase;
	}

	/* Esito: nota a margine in inchiostro; in rosso se e' un errore */
	.exam-picker-message {
		clear: both;
		padding: var(--space-3) var(--space-4);
		border-left: 4px solid var(--color-ink);
		border-radius: var(--radius-xs);
		background: var(--color-ink-soft);
		color: var(--color-text);
		font-weight: var(--weight-semibold);
		animation: message-in var(--duration-mark) var(--ease-out);
	}

	.exam-picker-message.is-error {
		border-left-color: var(--color-danger);
		background: var(--color-danger-soft);
		color: var(--color-danger);
	}

	.exam-picker-message:focus-visible {
		outline-offset: 3px;
	}

	@keyframes message-in {
		from {
			opacity: 0;
			transform: translateY(-0.25rem);
		}
	}

	.exam-picker-section {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		min-width: 0;
		clear: both;
		padding-top: var(--space-5);
		border-top: 1px solid var(--color-rule);
	}

	.exam-picker-heading {
		font-size: var(--text-md);
		font-weight: var(--weight-semibold);
		line-height: var(--leading-snug);
		color: var(--color-text);
	}

	.exam-picker-hint {
		max-width: 60ch;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.exam-picker-empty {
		font-family: var(--font-display);
		font-style: italic;
		color: var(--color-text-muted);
	}

	/* Elenchi d'esame */
	.exam-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.exam-list-item {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-1) var(--space-3);
		min-width: 0;
	}

	.exam-list-name {
		flex: 1 1 10rem;
		min-width: 0;
		font-weight: var(--weight-semibold);
		overflow-wrap: anywhere;
	}

	.exam-list-cfu {
		font-family: var(--font-display);
		font-variant-numeric: lining-nums tabular-nums;
		color: var(--color-text-muted);
		white-space: nowrap;
	}

	.exam-list-status {
		flex-basis: 100%;
		order: 3;
		font-size: var(--text-sm);
		color: var(--color-text-muted);
	}

	.exam-list-action {
		margin: 0;
		margin-inline-start: auto;
	}

	/* Tentativi, azioni e form "Registra esito" occupano ciascuno una riga intera */
	.exam-list-attempts,
	.exam-list-actions,
	.exam-list-record {
		flex-basis: 100%;
		order: 4;
		min-width: 0;
	}

	.exam-list-actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	.exam-list-actions .exam-list-action {
		margin-inline-start: 0;
	}

	.exam-list-record:empty {
		display: none;
	}

	.exam-list-action .button {
		padding-inline: var(--space-4);
	}

	/* Esami fissati nel giorno: come le etichette del calendario */
	.exam-list:not(.exam-list-catalog) .exam-list-item {
		padding: var(--space-2) var(--space-2) var(--space-2) var(--space-3);
		border-left: 3px solid var(--color-ink);
		border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
		background: var(--color-ink-soft);
	}

	.exam-list:not(.exam-list-catalog) .exam-list-action .button {
		background: var(--color-paper);
	}

	.exam-list:not(.exam-list-catalog) .exam-list-action .button:hover:not(:disabled) {
		background: var(--color-field);
	}

	/* Catalogo: righe del libretto, scorrevole se lungo */
	.exam-list-catalog {
		gap: 0;
		max-height: 18rem;
		overflow-y: auto;
		overscroll-behavior: contain;
		border-block: 1px solid var(--color-paper-edge);
	}

	.exam-list-catalog .exam-list-item {
		padding: var(--space-2) var(--space-1);
		border-bottom: 1px solid var(--color-rule);
	}

	.exam-list-catalog .exam-list-item:last-child {
		border-bottom: 0;
	}

	/* Ricerca: stesso campo dei moduli (FormField) */
	.exam-search {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}

	.exam-search-label {
		font-weight: var(--weight-semibold);
		color: var(--color-text);
	}

	.exam-search-input {
		width: 100%;
		min-height: 2.75rem;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-field-border);
		border-radius: var(--radius-sm);
		background: var(--color-field);
		color: var(--color-text);
		font-size: var(--text-base);
		transition: border-color var(--duration-fast) ease;
	}

	.exam-search-input:hover {
		border-color: var(--color-ink);
	}

	.exam-search-input:focus-visible {
		outline: 3px solid var(--color-focus);
		outline-offset: 1px;
		border-color: var(--color-ink);
	}

	/* Su smartphone "Crea esame" a tutta larghezza; il form aperto occupa sempre la riga */
	.exam-picker-create {
		align-items: stretch;
	}

	.exam-picker-create > div {
		align-self: stretch;
	}

	/* Chiuso: niente spazio vuoto sotto il pulsante */
	.exam-picker-create > div:empty {
		display: none;
	}

	@media (min-width: 30rem) {
		.exam-picker-create {
			align-items: flex-start;
		}
	}

	@media (min-width: 40rem) {
		.exam-picker-title {
			font-size: var(--text-2xl);
		}
	}
</style>
