import { SlashCommandBuilder } from '@discordjs/builders';

const DelMsgsCommand = new SlashCommandBuilder()
    .setName('del')
    .setDescription('Deletes last [count] messages in the channel this command is used in')
    .addIntegerOption(option =>
        option.setName('count')
        .setDescription('Number of messages to delete')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true))
    .addMentionableOption(sub =>
        sub.setName("user")
        .setDescription('The specific user to delete messages from'));
        

export default DelMsgsCommand.toJSON();