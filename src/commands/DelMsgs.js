import { SlashCommandBuilder } from '@discordjs/builders';

const DelMsgsCommand = new SlashCommandBuilder()
    .setName('del')
    .setDescription('Deletes last [count] messages in the channel this command is used in')
    .addIntegerOption(option =>
        option.setName('count')
        .setDescription('Number of messages to delete')
        .setMinValue(0)
        .setMaxValue(3)
        .setRequired(true))
    .addIntegerOption(sub =>
        sub.setName("userid")
        .setDescription('The specific user to delete messages from')
        .setMinValue(0));

export default DelMsgsCommand.toJSON();