import { config } from 'dotenv';
import { Client, GatewayIntentBits, Routes } from 'discord.js';
import { REST } from 'discord.js';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CASTIE_ID = process.env.CASTIE_ID;
const ARK_GUILD_ID = process.env.ARK_GUILD_ID;
const ARK_CHANNEL_ID_BOTS = process.env.ARK_CHANNEL_ID_BOTS;
const ARK_CHANNEL_ID_DA_CHAT = process.env.ARK_CHANNEL_ID_DA_CHAT;
const ARK_CHANNEL_ID_HOTCHIP = process.env.ARK_CHANNEL_ID_HOTCHIP;
const ARK_WHITELISTED_CHANNEL_IDS = process.env.ARK_WHITELISTED_CHANNEL_IDS.split(", ");

const PERSONAL_GUILD_ID = process.env.PERSONAL_GUILD_ID;
const PERSONAL_CHANNEL_ID_GENERAL = process.env.PERSONAL_CHANNEL_ID_GENERAL;
const PERSONAL_CHANNEL_ID_N = process.env.PERSONAL_CHANNEL_ID_N;

const MASHIRO_PRAY_EMOTE_ID = process.env.MASHIRO_PRAY_EMOTE_ID;
const MIFU_SHRIMP_EMOTE_ID = process.env.MIFU_SHRIMP_EMOTE_ID;

const allowedArkChannels = [ ARK_CHANNEL_ID_BOTS, ARK_CHANNEL_ID_DA_CHAT, ARK_CHANNEL_ID_HOTCHIP];

const rest = new REST({ version: '10' }).setToken(TOKEN);

const GUILD_ID = PERSONAL_GUILD_ID;

var mifuTimer = 200;
const mifuTimerReset = 200;

client.on('ready', () => console.log(`${client.user.tag} has logged in!`));

client.on('interactionCreate', (interaction) => {
    if (interaction.isChatInputCommand()) {
        console.log('Hello, world!');
        interaction.reply({ content:'Hey there!!!' });
    }
});










function sayMifuShrimp(channel) {
    channel.send('<:mifushrimp:' + MIFU_SHRIMP_EMOTE_ID + '>');
    mifuTimer = mifuTimerReset;
}

function sayCute(message) {
    const msgLower = message.content.toLowerCase();
    
    if (msgLower.includes('cute')) {
        message.reply({content: 'cute... <:mashiropray:' + MASHIRO_PRAY_EMOTE_ID + '>'});
    }
}

client.on('messageCreate', (message) => {
    console.log(message.createdAt.toDateString(), `${message.author.tag}:`, `"${message.content}"`);
    
    const msgLower = message.content.toLowerCase();
    const msgContent = message.content;
    
    mifuTimer--;
    if (mifuTimer <= 0) {
        var randomWhitelistedChannel = (ARK_WHITELISTED_CHANNEL_IDS[Math.floor(Math.random() * ARK_WHITELISTED_CHANNEL_IDS.length)]);
        
        //sayMifuShrimp(client.channels.fetch(parseInt(randomWhitelistedChannel)));
        let targChannel = message.client.channels.cache.get(randomWhitelistedChannel);
        sayMifuShrimp(targChannel);
    }


    if (msgLower == 'ayy') {
        message.channel.send("ayy lmao");
    } else if (msgLower == 'maybe') {
        message.channel.send("or maybe not");
    } else if (message.author.id == CASTIE_ID) {
        let guildID = message.guild.id;
        let channelID = message.channel.id;

        const allowed = (element) => element == channelID;
        

        if (guildID != ARK_GUILD_ID) {
            
            sayCute(message);
        } else {
            if (allowedArkChannels.some(allowed))
                sayCute(message);
        }
        
//const img = message.channel.send({ files: [{ attachment: img.toBuffer(), name: 'newName.png' }] });

        

        //const attachment = new MessageAttachment("src/img/memes/sayori.jpg"); //ex. https://i.imgur.com/random.jpg

        //message.channel.send({ content: "I sent you a photo!", files: [attachment] })
        /*
        let server = message.guild.id;
        let channel = message.channel.id;

        message.reply("server: " + server + "\nchannel: " + channel);*/
        //message.reply(message.author.id);
    }

    let msgAuthor = message.author
    let clientID = client.user.id
    if (msgAuthor.id != clientID) {
        if (msgLower.includes('x.com')) {
            if (!msgLower.includes('vxtwitter.com'))
                message.reply(msgContent.replaceAll("x.com", "vxtwitter.com"));
        } else if (msgLower.includes('twitter.com')) {
            if (!msgLower.includes('vxtwitter.com'))
                message.reply(msgContent.replaceAll("twitter.com", "vxtwitter.com"));
        }

        if (msgLower.includes('tiktok.com')) {
            if (!msgLower.includes('vxtiktok.com'))
                message.reply(msgContent.replaceAll("tiktok.com", "vxtiktok.com"));
        }

        if (msgLower.includes('pixiv.net')) {
            if (!msgLower.includes('phixiv.net'))
                message.reply(msgContent.replaceAll("pixiv.net", "phixiv.net"));
        }
    }
})










async function main() {
    const commands = [
        {
            name: `tutone`,
            description: `Replies with pong!`,
        },
        {
            name: `tuttwo`,
            description: `Replies with pong!`,
        },
    ];

    try {
        console.log(`Started refreshing application (/) commands.`);
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });
        client.login(TOKEN);
    } catch (err) {
        console.log(err);
    }
}

main();