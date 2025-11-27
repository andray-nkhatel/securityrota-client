/**
 * Format a date string with specified options
 * @param {string|Date} date - The date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, options);
}

/**
 * Format a date string with date and time
 * @param {string|Date} date - The date to format
 * @param {Intl.DateTimeFormatOptions} options - Formatting options
 * @returns {string} Formatted date-time string
 */
export function formatDateTime(date, options = {}) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(undefined, options);
}

