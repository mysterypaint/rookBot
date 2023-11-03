import { SlashCommandBuilder } from '@discordjs/builders';

const diceRollListCommand = new SlashCommandBuilder()
  .setName('rolllist')
  .setDescription('\'2d6\' - Roll 2 dice with 6 sides')
  .addStringOption(option =>
		option.setName('input')
			.setDescription('Your input')
      .setMaxLength(5));

export default diceRollListCommand.toJSON();