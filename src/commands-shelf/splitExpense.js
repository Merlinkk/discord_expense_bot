// src/commands/splitExpense.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sheetsService = require('../services/sheetsService');
const { formatCurrency } = require('../utils/formatUtils');
const { formatDate } = require('../utils/dateUtils');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('splitexpense')
    .setDescription('Split an expense between multiple users')
    .addNumberOption(option =>
      option.setName('amount')
        .setDescription('The total expense amount')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('A short description of the expense')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The expense category')
        .setRequired(false)
        .addChoices(
          ...config.expenseCategories.map(category => ({ name: category, value: category }))
        ))
    .addUserOption(option =>
      option.setName('user1')
        .setDescription('First user to split with')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('user2')
        .setDescription('Second user to split with')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('user3')
        .setDescription('Third user to split with')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('user4')
        .setDescription('Fourth user to split with')
        .setRequired(false))
    .addUserOption(option =>
      option.setName('user5')
        .setDescription('Fifth user to split with')
        .setRequired(false)),
  
  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      // Get expense details
      const amount = interaction.options.getNumber('amount');
      const description = interaction.options.getString('description');
      const category = interaction.options.getString('category') || 'Split';
      const timestamp = formatDate(new Date());
      
      // Collect unique users
      const users = new Set();
      for (let i = 1; i <= 5; i++) {
        const user = interaction.options.getUser(`user${i}`);
        if (user) {
          users.add(user.username);
        }
      }
      
      // Convert Set to Array
      const userArray = Array.from(users);
      
      // Validate amount
      if (amount <= 0) {
        return interaction.editReply('Amount must be greater than 0.');
      }
      
      // Validate that we have at least 2 users
      if (userArray.length < 2) {
        return interaction.editReply('You need at least 2 different users to split an expense.');
      }
      
      // Calculate split amount
      const splitAmount = amount / userArray.length;
      
      // Split the expense
      await sheetsService.splitExpense(amount, description, userArray, timestamp, category);
      
      // Build response embed
      const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('Expense Split')
        .setDescription(`The expense has been split between ${userArray.length} users.`)
        .addFields(
          { name: 'Total Amount', value: formatCurrency(amount), inline: true },
          { name: 'Split Amount', value: `${formatCurrency(splitAmount)} per person`, inline: true },
          { name: 'Category', value: category, inline: true },
          { name: 'Description', value: description },
          { name: 'Timestamp', value: timestamp, inline: true },
          { name: 'Split Between', value: userArray.join(', ') }
        )
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in splitExpense command:', error);
      return interaction.editReply('There was an error splitting the expense. Please try again later.');
    }
  },
};