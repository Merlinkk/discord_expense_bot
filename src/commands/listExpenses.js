// src/commands/listExpenses.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sheetsService = require('../services/sheetsService');
const { formatCurrency, truncate } = require('../utils/formatUtils');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listexpenses')
    .setDescription('List recent expenses with optional filters')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Filter by expense category')
        .setRequired(false)
        .addChoices(
          ...config.expenseCategories.map(category => ({ name: category, value: category }))
        ))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Filter by user')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('limit')
        .setDescription('Number of expenses to show (default: 10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get filter options
      const category = interaction.options.getString('category');
      const userOption = interaction.options.getUser('user');
      const username = userOption ? userOption.username : null;
      const limit = interaction.options.getInteger('limit') || 10;
      
      // Build filters object
      const filters = {};
      if (category) filters.category = category;
      if (username) filters.username = username;
      
      // Get expenses from the sheet
      let expenses = await sheetsService.getExpenses(filters);
      
      // Sort expenses by timestamp (most recent first)
      expenses.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
      
      // Limit number of results
      expenses = expenses.slice(0, limit);
      
      if (expenses.length === 0) {
        return interaction.editReply('No expenses found matching your criteria.');
      }
      
      // Build embed response
      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('Recent Expenses')
        .setDescription(
          `Showing ${expenses.length} ${expenses.length === 1 ? 'expense' : 'expenses'}` +
          `${category ? ` in category "${category}"` : ''}` +
          `${username ? ` by ${username}` : ''}`
        )
        .setTimestamp();
      
      // Add expense fields
      expenses.forEach((expense, index) => {
        embed.addFields({
          name: `${index + 1}. ${formatCurrency(expense.Amount)} - ${expense.Category}`,
          value: `${truncate(expense.Description, 100)}\nBy: ${expense.Username} • Date: ${expense.Timestamp}`
        });
      });
      
      // Calculate total
      const total = expenses.reduce((sum, expense) => sum + expense.Amount, 0);
      embed.addFields({
        name: 'Total',
        value: formatCurrency(total)
      });
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in listExpenses command:', error);
      return interaction.editReply('There was an error fetching the expense list. Please try again later.');
    }
  },
};