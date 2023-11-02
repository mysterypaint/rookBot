import { SlashCommandBuilder } from '@discordjs/builders';

const sayoriCommand = new SlashCommandBuilder()
  .setName('sayori')
  .setDescription('Sends sayori.png');

export default sayoriCommand.toJSON();