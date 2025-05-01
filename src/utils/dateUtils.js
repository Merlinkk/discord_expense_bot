const moment = require('moment');
const config = require('../config');

/**
 * Format a date using the configured date format
 * @param {Date} date - The date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
  return moment(date).format(config.dateFormat);
}

/**
 * Get the start date for a given period (week/month)
 * @param {string} period - The period type ('week' or 'month')
 * @returns {Date} - The start date
 */
function getStartDateForPeriod(period) {
  const now = moment();
  
  if (period === 'week') {
    return now.startOf('week').toDate();
  } else if (period === 'month') {
    return now.startOf('month').toDate();
  } else {
    throw new Error('Invalid period. Use "week" or "month".');
  }
}

/**
 * Get a readable date range string for a period
 * @param {string} period - The period type ('week' or 'month')
 * @returns {string} - Formatted date range
 */
function getReadableDateRange(period) {
  const now = moment();
  let start;
  
  if (period === 'week') {
    start = moment().startOf('week');
    return `${start.format('MMM D')} - ${now.format('MMM D, YYYY')}`;
  } else if (period === 'month') {
    return now.format('MMMM YYYY');
  } else {
    throw new Error('Invalid period. Use "week" or "month".');
  }
}

module.exports = {
  formatDate,
  getStartDateForPeriod,
  getReadableDateRange
};
