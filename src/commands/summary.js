const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sheetsService = require('../services/sheetsService');
const { formatCurrency } = require('../utils/formatUtils');
const { getReadableDateRange } = require('../utils/dateUtils');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Get expense summaries by period')
    .addStringOption(option =>
      option.setName('period')
        .setDescription('Time period for the summary')
        .setRequired(true)
        .addChoices(
          { name: 'This Week', value: 'week' },
          { name: 'This Month', value: 'month' }
        ))
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
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const period = interaction.options.getString('period');
      const category = interaction.options.getString('category');
      const userOption = interaction.options.getUser('user');
      const username = userOption ? userOption.username : null;

      const filters = {};
      if (category) filters.category = category;
      if (username) filters.username = username;
      
      const summary = await sheetsService.getSummary(period, filters);
      
      if (summary.expenseCount === 0) {
        return interaction.editReply(`No expenses found for ${period === 'week' ? 'this week' : 'this month'}${category ? ` in category "${category}"` : ''}${username ? ` by ${username}` : ''}.`);
      }

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle(`Expense Summary: ${period === 'week' ? 'This Week' : 'This Month'}`)
        .setDescription(`Expense summary for ${getReadableDateRange(period)}${category ? ` in category "${category}"` : ''}${username ? ` by ${username}` : ''}.`)
        .addFields(
          { name: 'Total Expenses', value: formatCurrency(summary.totalAmount), inline: true },
          { name: 'Number of Expenses', value: summary.expenseCount.toString(), inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'ExpenseTracker Bot' });
      
      // Only add category breakdown if no category filter is applied and we have data
      if (!category && Object.keys(summary.categoryTotals || {}).length > 0) {
        const categoryBreakdown = Object.entries(summary.categoryTotals)
          .sort(([, a], [, b]) => b - a)
          .map(([cat, amount]) => `${cat}: ${formatCurrency(amount)}`)
          .join('\n');
        
        if (categoryBreakdown) {
          embed.addFields({ name: 'Category Breakdown', value: categoryBreakdown });
        }
      }
      
      // Only add user breakdown if no user filter is applied and we have multiple users
      if (!username && Object.keys(summary.userTotals || {}).length > 1) {
        const userBreakdown = Object.entries(summary.userTotals)
          .sort(([, a], [, b]) => b - a)
          .map(([user, amount]) => `${user}: ${formatCurrency(amount)}`)
          .join('\n');
        
        if (userBreakdown) {
          embed.addFields({ name: 'User Breakdown', value: userBreakdown });
        }
      }

      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in summary command:', error);
      return interaction.editReply('There was an error generating the expense summary. Please try again later.');
    }
  },
};