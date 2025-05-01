module.exports = {
    botToken: process.env.BOT_TOKEN,
    googleSheetId: process.env.GOOGLE_SHEET_ID,
    // The GOOGLE_APPLICATION_CREDENTIALS environment variable is used by the 
    // Google API library directly, so we don't need to export it here
    
    // Sheet configuration
    sheetConfig: {
      worksheetName: 'ExpenseData',
      headerRow: ['Timestamp', 'Username', 'Amount', 'Category', 'Description'],
      // Add additional worksheet names for other features
      summaryWorksheet: 'Summary',
      budgetWorksheet: 'Budgets'
    },
    
    // Bot configuration
    defaultCurrency: '$',
    expenseCategories: [
      'Food', 'Rent', 'Utilities', 'Entertainment', 
      'Transportation', 'Shopping', 'Health', 'Other'
    ],
    
    // Feature toggles
    enableCharts: true,
    enableBudgetAlerts: true,
    
    // Formatting options
    dateFormat: 'YYYY-MM-DD HH:mm:ss'
  };
  