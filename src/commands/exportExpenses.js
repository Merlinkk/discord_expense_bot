// src/commands/exportExpenses.js
const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const sheetsService = require('../services/sheetsService');
const { getStartDateForPeriod } = require('../utils/dateUtils');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('exportexpenses')
    .setDescription('Export expenses to a CSV file')
    .addStringOption(option =>
      option.setName('period')
        .setDescription('Time period for the export')
        .setRequired(false)
        .addChoices(
          { name: 'All Time', value: 'all' },
          { name: 'This Week', value: 'week' },
          { name: 'This Month', value: 'month' }
        ))
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Filter by expense category')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Filter by user')
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get filter options
      const period = interaction.options.getString('period') || 'all';
      const category = interaction.options.getString('category');
      const userOption = interaction.options.getUser('user');
      const username = userOption ? userOption.username : null;
      
      // Build filters object
      const filters = {};
      if (category) filters.category = category;
      if (username) filters.username = username;
      
      // Add date filter if period is specified
      if (period !== 'all') {
        filters.fromDate = getStartDateForPeriod(period);
      }
      
      // Get expenses from the sheet
      let expenses = await sheetsService.getExpenses(filters);
      
      if (expenses.length === 0) {
        return interaction.editReply('No expenses found matching your criteria.');
      }
      
      // Sort expenses by timestamp (most recent first)
      expenses.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
      
      // Create CSV content
      let csvContent = 'Timestamp,Username,Amount,Category,Description\n';
      
      expenses.forEach(expense => {
        // Format fields properly for CSV - ensure quote wrapping for fields that might contain commas
        const csvRow = [
          `"${expense.Timestamp || ''}"`,
          `"${expense.Username || ''}"`,
          expense.Amount || 0,
          `"${expense.Category || ''}"`,
          `"${(expense.Description || '').replace(/"/g, '""')}"` // Escape existing double quotes
        ].join(',');
        
        csvContent += csvRow + '\n';
      });
      
      // Create temporary file
      const tempDir = os.tmpdir();
      const fileName = `expenses-${period}-${Date.now()}.csv`;
      const filePath = path.join(tempDir, fileName);
      
      // Write to file
      fs.writeFileSync(filePath, csvContent, 'utf8');
      
      // Generate period name for message
      let periodName = 'All Time';
      if (period === 'week') periodName = 'This Week';
      if (period === 'month') periodName = 'This Month';
      
      // Create filters description
      let filtersDesc = periodName;
      if (category) filtersDesc += ` - Category: ${category}`;
      if (username) filtersDesc += ` - User: ${username}`;
      
      // Upload file as attachment
      const attachment = new AttachmentBuilder(filePath, { name: fileName });
      
      await interaction.editReply({
        content: `Exported ${expenses.length} expenses (${filtersDesc})`,
        files: [attachment]
      });
      
      // Clean up temporary file after sending
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    } catch (error) {
      console.error('Error in exportExpenses command:', error);
      return interaction.editReply('There was an error exporting expenses. Please try again later.');
    }
  },
};