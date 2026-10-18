/** Limiti dell'importazione JSON degli esami, condivisi tra client (suggerimenti) e server. */
export const IMPORT_MAX_BYTES = 100 * 1024;
export const IMPORT_MAX_ITEMS = 200;

/** Esempio del formato, mostrato nel profilo e copiabile. */
export const IMPORT_EXAMPLE = `[
  { "name": "Analisi matematica I", "cfu": 12, "date": "2025-02-10", "grade": 28, "teacher": "Mario Rossi" },
  { "name": "Programmazione", "cfu": 9, "date": "2025-06-20", "grade": "30L" },
  { "name": "Fisica", "cfu": 6, "date": "2025-07-01", "grade": 24, "rejected": true, "notes": "rifiutato" },
  { "name": "Chimica", "cfu": 6, "date": "2025-01-15", "grade": null }
]`;
