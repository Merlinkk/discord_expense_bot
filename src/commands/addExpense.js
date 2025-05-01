// src/commands/addExpense.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sheetsService = require('../services/sheetsService');
const { formatCurrency } = require('../utils/formatUtils');
const { formatDate } = require('../utils/dateUtils');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addexpense')
    .setDescription('Add a new expense to the tracker')
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('The expense amount')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The expense category')
        .setRequired(true)
        .addChoices(
          ...config.expenseCategories.map(category => ({ name: category, value: category }))
        ))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('A short description of the expense')
        .setRequired(true)),
  
  async execute(interaction) {
    await interaction.deferReply(); // Defer reply as the Google Sheets operation may take time
    
    try {
      const username = interaction.user.username;
      const amount = interaction.options.getNumber('amount');
      const category = interaction.options.getString('category');
      const description = interaction.options.getString('description');
      const timestamp = formatDate(new Date());
      
      // Validate amount
      if (amount <= 0) {
        return interaction.editReply('Amount must be greater than 0.');
      }
      
      // Add expense to Google Sheet
      await sheetsService.addExpense(username, amount, category, description, timestamp);
      
      // Build response embed
      const embed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setTitle('Expense Added')
        .setDescription(`Your expense has been recorded successfully.`)
        .addFields(
          { name: 'Amount', value: formatCurrency(amount), inline: true },
          { name: 'Category', value: category, inline: true },
          { name: 'Description', value: description },
          { name: 'Added By', value: username, inline: true },
          { name: 'Timestamp', value: timestamp, inline: true }
        )
        .setTimestamp();
      
      // Check for budget alerts if enabled
      if (config.enableBudgetAlerts) {
        const budget = await sheetsService.getBudget(username);
        if (budget) {
          // Get current month's expenses
          const monthSummary = await sheetsService.getSummary('month', { username });
          const monthTotal = monthSummary.totalAmount;
          
          // Check if monthly budget is exceeded
          if (monthTotal > budget.monthlyBudget) {
            embed.addFields({
              name: '⚠️ Budget Alert',
              value: `You've exceeded your monthly budget of ${formatCurrency(budget.monthlyBudget)}. Current spending: ${formatCurrency(monthTotal)}.`
            });
          }
          // Check category budget if available
          const categoryBudget = budget.categories && budget.categories[category];
          if (categoryBudget) {
            const categoryTotal = monthSummary.categoryTotals[category] || 0;
            if (categoryTotal > categoryBudget) {
              embed.addFields({
                name: `⚠️ ${category} Budget Alert`,
                value: `You've exceeded your ${category} budget of ${formatCurrency(categoryBudget)}. Current ${category} spending: ${formatCurrency(categoryTotal)}.`
              });
            }
          }
        }
      }
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in addExpense command:', error);
      return interaction.editReply('There was an error adding your expense. Please try again later.');
    }
  },
};