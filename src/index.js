import {
	config
} from 'dotenv';
import {
	Client,
	Events,
	GatewayIntentBits,
	InteractionType,
	Routes,
	SlashCommandBuilder,
} from 'discord.js';
import {
	REST
} from '@discordjs/rest';
import SayoriCommand from './commands/sayori.js';
import DelMsgsCommand from './commands/delMsgs.js';
import DiceRollCommand from './commands/diceRoll.js';
import DiceRollListCommand from './commands/diceRollList.js';
import YuptuneCommand from './commands/yuptune.js';
import fetch from 'node-fetch';
import SiteScraper from './siteScraper.js';
import Utility from './utility.js';
import Rook from './rook.js';

// Debug Parameters
const debugP = {};
debugP.disTwit = true;
debugP.logScrapedURLs = false;



// Create the client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
});

// Grab and declare all environment variables from .env
config();

const siteScraper = new SiteScraper();
const utility = new Utility();
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const rook = new Rook(process, client, debugP);

const rest = new REST({
	version: '10'
}).setToken(TOKEN);

// Wait for the client to get ready; print to console when it logs in
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

/// Listens to every single Discord bot-slash-message sent to the server the bot is on (e.g. "/roll <value>")
client.on(`interactionCreate`, (interaction) => {
	rook.interactionCreateEvent(interaction);
});

/// Listens to every single Discord message sent to the server the bot is on
client.on('messageCreate', async (message) => {
	rook.messageCreateEvent(message);
});

async function main() {
	// Init all the Slash commands
	const commands = [
		SayoriCommand,
		YuptuneCommand,
		DelMsgsCommand,
		DiceRollCommand,
		DiceRollListCommand,
	];

	try {
		console.log('Started refreshing application (/) commands.');
		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
			body: commands,
		});
		client.login(TOKEN);
	} catch (err) {
		console.log(err);
	}
}

main();