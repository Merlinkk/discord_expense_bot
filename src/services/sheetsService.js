const { google } = require('googleapis');
const config = require('../config');

class SheetsService {
  constructor() {
    this.sheets = null;
    this.auth = null;
    this.initialized = false;
  }
  
  async initialize() {
    try {
      // Auth is handled automatically by the library using the 
      // GOOGLE_APPLICATION_CREDENTIALS environment variable
      this.auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });
      
      const authClient = await this.auth.getClient();
      this.sheets = google.sheets({ version: 'v4', auth: authClient });
      this.initialized = true;
      
      // Ensure the worksheet exists and has the correct headers
      await this.setupWorksheet();
      
      console.log('Google Sheets service initialized');
    } catch (error) {
      console.error('Error initializing Google Sheets service:', error);
      throw error;
    }
  }
  
  async setupWorksheet() {
    try {
      // Get existing sheets
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheetId
      });
      
      const sheets = response.data.sheets;
      const mainSheetExists = sheets.some(sheet => 
        sheet.properties.title === config.sheetConfig.worksheetName
      );
      
      // Create main expense sheet if it doesn't exist
      if (!mainSheetExists) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.googleSheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: config.sheetConfig.worksheetName
                  }
                }
              }
            ]
          }
        });
        
        // Add header row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: config.googleSheetId,
          range: `${config.sheetConfig.worksheetName}!A1:E1`,
          valueInputOption: 'RAW',
          resource: {
            values: [config.sheetConfig.headerRow]
          }
        });
      }
      
      // Similarly, create other needed worksheets (budget, summary, etc.)
    } catch (error) {
      console.error('Error setting up worksheet:', error);
      throw error;
    }
  }
  
  async addExpense(username, amount, category, description, timestamp) {
    if (!this.initialized) await this.initialize();
    console.log(username, amount, category, description, timestamp);
    try {
      // Format the row data
      const values = [[
        timestamp,
        username,
        parseFloat(amount),
        category,
        description
      ]];
      
      // Append the row to the sheet
      await this.sheets.spreadsheets.values.append({
        spreadsheetId: config.googleSheetId,
        range: `${config.sheetConfig.worksheetName}!A:E`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        resource: { values }
      });
      
      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }
  
  async getExpenses(filters = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Get all expense data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheetId,
        range: `${config.sheetConfig.worksheetName}!A:E`
      });
      
      const values = response.data.values || [];
      
      if (values.length <= 1) {
        return []; // Only header row or empty sheet
      }
      
      // Extract header and data rows
      const headers = values[0];
      const dataRows = values.slice(1);
      
      // Convert rows to objects for easier filtering
      let expenses = dataRows.map(row => {
        const expense = {};
        headers.forEach((header, index) => {
          // Convert amount to number
          if (header === 'Amount' && row[index]) {
            expense[header] = parseFloat(row[index]);
          } else {
            expense[header] = row[index];
          }
        });
        return expense;
      });
      
      // Apply filters if provided
      if (filters.username) {
        expenses = expenses.filter(expense => 
          expense.Username && expense.Username.toLowerCase() === filters.username.toLowerCase()
        );
      }
      
      if (filters.category) {
        expenses = expenses.filter(expense => 
          expense.Category && expense.Category.toLowerCase() === filters.category.toLowerCase()
        );
      }
      
      if (filters.fromDate) {
        expenses = expenses.filter(expense => 
          new Date(expense.Timestamp) >= new Date(filters.fromDate)
        );
      }
      
      return expenses;
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  }
  
  async getSummary(period, filters = {}) {
    const expenses = await this.getExpenses(filters);
    
    // Determine the start date based on the period
    const now = new Date();
    let startDate;
    
    if (period === 'week') {
      // Calculate start of week (Sunday)
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      // Calculate start of month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      throw new Error('Invalid period. Use "week" or "month".');
    }
    
    // Filter expenses by date
    const periodExpenses = expenses.filter(expense => 
      new Date(expense.Timestamp) >= startDate
    );
    
    // Calculate summary by category
    const categoryTotals = {};
    periodExpenses.forEach(expense => {
      const category = expense.Category || 'Uncategorized';
      categoryTotals[category] = (categoryTotals[category] || 0) + expense.Amount;
    });
    
    // Calculate summary by user
    const userTotals = {};
    periodExpenses.forEach(expense => {
      const username = expense.Username;
      userTotals[username] = (userTotals[username] || 0) + expense.Amount;
    });
    
    // Calculate total
    const totalAmount = periodExpenses.reduce((sum, expense) => sum + expense.Amount, 0);
    
    return {
      period,
      startDate,
      endDate: now,
      totalAmount,
      categoryTotals,
      userTotals,
      expenseCount: periodExpenses.length
    };
  }
  
  async splitExpense(amount, description, users, timestamp, category = 'Split') {
    if (!this.initialized) await this.initialize();
    
    const splitAmount = parseFloat(amount) / users.length;
    
    try {
      // Create a row for each user's portion
      const promises = users.map(async username => {
        const values = [[
          timestamp,
          username,
          splitAmount.toFixed(2),
          category,
          `${description} (Split ${users.length} ways)`
        ]];
        
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: config.googleSheetId,
          range: `${config.sheetConfig.worksheetName}!A:E`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: { values }
        });
      });
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Error splitting expense:', error);
      throw error;
    }
  }
  
  async getBudget(username) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Check if budget worksheet exists
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheetId
      });
      
      const budgetSheet = spreadsheet.data.sheets.find(
        sheet => sheet.properties.title === config.sheetConfig.budgetWorksheet
      );
      
      if (!budgetSheet) {
        return null; // Budget worksheet doesn't exist
      }
      
      // Get budget data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheetId,
        range: `${config.sheetConfig.budgetWorksheet}!A:C`
      });
      
      const values = response.data.values || [];
      
      if (values.length <= 1) {
        return null; // Only header row or empty sheet
      }
      
      // Find the budget for the specified user
      const userBudgetRow = values.find(row => 
        row[0] && row[0].toLowerCase() === username.toLowerCase()
      );
      
      if (!userBudgetRow) {
        return null; // No budget found for user
      }
      
      return {
        username: userBudgetRow[0],
        monthlyBudget: parseFloat(userBudgetRow[1] || 0),
        categories: userBudgetRow[2] ? JSON.parse(userBudgetRow[2]) : {}
      };
    } catch (error) {
      console.error('Error getting budget:', error);
      throw error;
    }
  }
  
  async setBudget(username, monthlyBudget, categories = {}) {
    if (!this.initialized) await this.initialize();
    
    try {
      // Check if budget worksheet exists and create if needed
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: config.googleSheetId
      });
      
      const budgetSheet = spreadsheet.data.sheets.find(
        sheet => sheet.properties.title === config.sheetConfig.budgetWorksheet
      );
      
      if (!budgetSheet) {
        // Create budget worksheet
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.googleSheetId,
          resource: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: config.sheetConfig.budgetWorksheet
                  }
                }
              }
            ]
          }
        });
        
        // Add header row
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: config.googleSheetId,
          range: `${config.sheetConfig.budgetWorksheet}!A1:C1`,
          valueInputOption: 'RAW',
          resource: {
            values: [['Username', 'MonthlyBudget', 'CategoryBudgets']]
          }
        });
      }
      
      // Get budget data to check if user already exists
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: config.googleSheetId,
        range: `${config.sheetConfig.budgetWorksheet}!A:C`
      });
      
      const values = response.data.values || [];
      
      let userRowIndex = -1;
      for (let i = 1; i < values.length; i++) {
        if (values[i][0] && values[i][0].toLowerCase() === username.toLowerCase()) {
          userRowIndex = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }
      
      const categoriesJson = JSON.stringify(categories);
      
      if (userRowIndex > 0) {
        // Update existing user budget
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: config.googleSheetId,
          range: `${config.sheetConfig.budgetWorksheet}!A${userRowIndex}:C${userRowIndex}`,
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[username, monthlyBudget, categoriesJson]]
          }
        });
      } else {
        // Add new user budget
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: config.googleSheetId,
          range: `${config.sheetConfig.budgetWorksheet}!A:C`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          resource: {
            values: [[username, monthlyBudget, categoriesJson]]
          }
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error setting budget:', error);
      throw error;
    }
  }
}

module.exports = new SheetsService();
