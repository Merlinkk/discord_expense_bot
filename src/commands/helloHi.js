const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('helloi')
		.setDescription('Replies with Yo!'),
	async execute(interaction) {
		await interaction.reply('Yo!');
	},
};