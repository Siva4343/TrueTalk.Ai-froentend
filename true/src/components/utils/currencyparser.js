/**
 * Parse currency values from various formats
 * @param {string|number} value - The currency value to parse
 * @returns {number} Parsed number
 */
export const parseCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  // Convert to string if it's a number
  const valueStr = String(value).trim();
  
  // Remove all non-numeric characters except dots, commas, and minus sign
  let cleanedValue = valueStr.replace(/[^\d.,-]/g, '');
  
  // Handle European format (comma as decimal separator)
  if (cleanedValue.includes(',') && !cleanedValue.includes('.')) {
    cleanedValue = cleanedValue.replace(',', '.');
  }
  
  // Remove any extra dots (keep only the last one for decimal)
  const dotCount = (cleanedValue.match(/\./g) || []).length;
  if (dotCount > 1) {
    const parts = cleanedValue.split('.');
    cleanedValue = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }
  
  // Remove commas used as thousand separators
  cleanedValue = cleanedValue.replace(/,/g, '');
  
  // Parse to float
  const parsed = parseFloat(cleanedValue);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format currency for display
 * @param {number} value - The numeric value
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale (default: 'en-US')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'USD', locale = 'en-US') => {
  const numValue = typeof value === 'string' ? parseCurrency(value) : value;
  
  if (isNaN(numValue) || numValue === null || numValue === undefined) {
    return '$0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

/**
 * Check if a string is a valid currency
 * @param {string} str - String to check
 * @returns {boolean} True if valid currency
 */
export const isValidCurrency = (str) => {
  if (!str || typeof str !== 'string') return false;
  
  const trimmed = str.trim();
  if (trimmed === '') return false;
  
  // Try to parse it
  const parsed = parseCurrency(trimmed);
  return !isNaN(parsed) && isFinite(parsed);
};