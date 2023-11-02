import { SlashCommandBuilder } from '@discordjs/builders';

const yuptuneCommand = new SlashCommandBuilder()
  .setName('yuptune')
  .setDescription('Sends Yuptune.gif');

export default yuptuneCommand.toJSON();