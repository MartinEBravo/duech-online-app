/**
 * Spanish month names for date formatting
 */
const SPANISH_MONTHS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

/**
 * Formats a date in Spanish format: "DD de MMMM de YYYY"
 * Example: "21 de noviembre de 2025"
 */
export function formatSpanishDate(date: Date = new Date()): string {
  return `${date.getDate()} de ${SPANISH_MONTHS[date.getMonth()]} de ${date.getFullYear()}`;
}
