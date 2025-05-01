const config = require('../config');

/**
 * Format an amount with the default currency symbol
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted amount with currency symbol
 */
function formatCurrency(amount) {
  return `${config.defaultCurrency}${parseFloat(amount).toFixed(2)}`;
}

/**
 * Format a Discord message as a table
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows
 * @returns {string} - Formatted table as a Discord code block
 */
function formatAsTable(headers, rows) {
  if (!rows || rows.length === 0) {
    return '```\nNo data available.\n```';
  }
  
  // Calculate column widths
  const columnWidths = headers.map((header, index) => {
    const maxDataWidth = rows.reduce((max, row) => {
      const cellValue = row[index] || '';
      return Math.max(max, String(cellValue).length);
    }, 0);
    return Math.max(String(header).length, maxDataWidth);
  });
  
  // Format header row
  let table = headers.map((header, index) => {
    return String(header).padEnd(columnWidths[index] + 2);
  }).join('');
  table += '\n';
  
  // Add separator row
  table += headers.map((_, index) => {
    return '-'.repeat(columnWidths[index]).padEnd(columnWidths[index] + 2);
  }).join('');
  table += '\n';
  
  // Add data rows
  rows.forEach(row => {
    const formattedRow = row.map((cell, index) => {
      return String(cell || '').padEnd(columnWidths[index] + 2);
    }).join('');
    table += formattedRow + '\n';
  });
  
  return '```\n' + table + '```';
}

/**
 * Truncate a string to a maximum length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
function truncate(str, maxLength) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

module.exports = {
  formatCurrency,
  formatAsTable,
  truncate
};