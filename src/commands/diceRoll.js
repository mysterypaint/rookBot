import { SlashCommandBuilder } from '@discordjs/builders';

const diceRollCommand = new SlashCommandBuilder()
  .setName('roll')
  .setDescription('\'2d6\' - Roll 2 dice with 6 sides')
  .addStringOption(option =>
		option.setName('input')
			.setDescription('Your input')
      .setMaxLength(5));

export default diceRollCommand.toJSON();