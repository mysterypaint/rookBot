import { config } from 'dotenv';
import { 
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    InteractionType,
    Routes,
    SlashCommandBuilder,
} from 'discord.js';
import { REST } from '@discordjs/rest';
//import sayoriCommand from './commands/sayori.js';
import yuptuneCommand from './commands/yuptune.js';
import fetch from 'node-fetch';

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
const GUILD_ID = process.env.GUILD_ID;
const ARK_CHANNEL_ID_BOTS = process.env.ARK_CHANNEL_ID_BOTS;
const ARK_CHANNEL_ID_DA_CHAT = process.env.ARK_CHANNEL_ID_DA_CHAT;
const ARK_CHANNEL_ID_HOTCHIP = process.env.ARK_CHANNEL_ID_HOTCHIP;
const ARK_CHANNEL_ID_ROOM3 = process.env.ARK_CHANNEL_ID_ROOM3;

const ARK_WHITELISTED_CHANNEL_IDS = process.env.ARK_WHITELISTED_CHANNEL_IDS.split(", ");

const PERSONAL_CHANNEL_ID_GENERAL = process.env.PERSONAL_CHANNEL_ID_GENERAL;
const PERSONAL_CHANNEL_ID_N = process.env.PERSONAL_CHANNEL_ID_N;

const MASHIRO_PRAY_EMOTE_ID = process.env.MASHIRO_PRAY_EMOTE_ID;
const MIFU_SHRIMP_EMOTE_ID = process.env.MIFU_SHRIMP_EMOTE_ID;
const OKEI_EMOTE_ID = process.env.OKEI_EMOTE_ID;

const allowedArkChannels = [ ARK_CHANNEL_ID_BOTS, ARK_CHANNEL_ID_DA_CHAT, ARK_CHANNEL_ID_HOTCHIP];

const rest = new REST({ version: '10' }).setToken(TOKEN);

var mifuTimer = getRandomInt(20, 200);
var okeiTimer = getRandomInt(20, 300);
var yuptuneTimer = getRandomInt(200, 2000);

var ayylmaoCooldownTimer = 0;
var maybenotCooldownTimer = 0;
var sayoriCooldownTimer = 0;

client.on('ready', () => console.log(`${client.user.tag} has logged in!`));

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function isValidHttpUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;  
    }

    return url.protocol === "http:" || url.protocol === "https:";
}

function attachFile(fPath, name, description) {
    return [{
        attachment: fPath,
        name: name,
        description: description,
    }];
}

function sendLocalFile(channel, fPath, name, description) {
    channel.send({
        files: [{
          attachment: fPath,
          name: name,
          description: description,
        }]
      })
        .then(console.log)
        .catch(console.error);
}

function sayMifuShrimp(channel) {
    channel.send('<:mifushrimp:' + MIFU_SHRIMP_EMOTE_ID + '>');
}

function sayOkei(channel) {
    channel.send('<:okei:' + OKEI_EMOTE_ID + '>');
}

function sayCute(message) {
    const msgContent = message.content;
    if (msgContent.toLowerCase().includes('cute')) {
        message.reply({content: 'cute... <:mashiropray:' + MASHIRO_PRAY_EMOTE_ID + '>'});
    }
}
async function fetchTweetData(twitURL) {
    twitURL = twitURL.replaceAll("vxtwitter\.com", "api.vxtwitter.com");
    const response = await fetch(twitURL);
    const data = await response.json();

    var jString = JSON.stringify(data);
    return jString;
}

async function PostTweetURLs(capturedURLs, message) {
    
    
    try {
        const tweetJsonStr = await fetchTweetData(capturedURLs[0]);
        let tweetObj = await JSON.parse(tweetJsonStr);
        const mediaURLs = await tweetObj.mediaURLs;
        const username = await tweetObj.user_screen_name;
        await message.channel.send({ content: "<http://twitter.com/" + username + ">",
        files: mediaURLs,
        });

        /*
        const embeddedTweet = await new EmbedBuilder()
        .setColor("#42b6f4")
        .addFields({
        name: `http://twitter.com/` + username, value: ' ',
        });
        await message.channel.send({ embeds: [embeddedTweet] });*/        
    } catch(error) {
        message.channel.send("Could not resolve to host: ", `${error}`);
    }
    //console.log(capturedURLs);
    
    //message.channel.send(capturedURLs[0]);
}

client.on(`interactionCreate`, (interaction) => {
    if (interaction.isChatInputCommand()) {
        switch(interaction.commandName) {
            /*
            case 'sayori':
                interaction.reply({
                    content: 'Hey there!!!',
                    files: attachFile('src/img/memes/sayori.png', 'sayori.png', 'Sayori')
                })
                break;*/
            case 'yuptune':
                interaction.reply({
                    files: attachFile('src/img/memes/Yuptune.gif', 'Yuptune.gif', 'Yuptune')
                })
                break;
        }        
    }
});

client.on('messageCreate', (message) => {
    if(message.author.bot)
        return;

    console.log(message.createdAt.toDateString(), `${message.author.tag}:`, `"${message.content}"`);
    
    const msgContent = message.content;
     
    mifuTimer--;
    if (mifuTimer <= 0) {
        var randomWhitelistedChannel = (ARK_WHITELISTED_CHANNEL_IDS[Math.floor(Math.random() * ARK_WHITELISTED_CHANNEL_IDS.length)]);
        let targChannel = message.client.channels.cache.get(randomWhitelistedChannel);
        sayMifuShrimp(targChannel);
        mifuTimer = getRandomInt(20, 200);
    }
    
    okeiTimer--;
    if (okeiTimer <= 0) {
        var randomWhitelistedChannel = (ARK_WHITELISTED_CHANNEL_IDS[Math.floor(Math.random() * ARK_WHITELISTED_CHANNEL_IDS.length)]);
        let targChannel = message.client.channels.cache.get(randomWhitelistedChannel);
        sayOkei(targChannel);
        okeiTimer = getRandomInt(20, 300);
    }
    
    yuptuneTimer--;
    if (yuptuneTimer <= 0) {
        let targChannel = message.client.channels.cache.get(ARK_CHANNEL_ID_ROOM3);
        sendLocalFile(targChannel, 'src/img/memes/Yuptune.gif', 'Yuptune.gif', 'Yuptune');
        yuptuneTimer = getRandomInt(200, 1000);
    }

    if (msgContent.includes('69')) {
        if(message.embeds.length > 0) {
            var embed = message.embeds[0];
            console.log(message);
            if(!embed.image) {
                var tmpMsg = new String(message);
                let reg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gm;
                tmpMsg = tmpMsg.replace(reg, '').trim();
                reg = /<:*.+:\d+>/gm;
                tmpMsg = tmpMsg.replace(reg, '').trim();
                console.log(tmpMsg);
                if (tmpMsg.length > 0 && tmpMsg.includes('69'))
                    message.channel.send("Nice");
            }
        } else if (!isValidHttpUrl(message)) {
            let reg = /<:*.+:\d+>/gm;
            var tmpMsg = new String(message);
            tmpMsg = tmpMsg.replace(reg, '').trim();
            console.log(tmpMsg);
            if (tmpMsg.includes('69'))
                message.channel.send("Nice");
        }
    }

    if (msgContent.toLowerCase().includes('castle') || msgContent.includes('castIe')) {
        message.react('<:mashiropray:' + MASHIRO_PRAY_EMOTE_ID + '>');
    }

    if (ayylmaoCooldownTimer <= 0) {
        if (msgContent.toLowerCase() == 'ayy') {
            message.channel.send("ayy lmao");
            ayylmaoCooldownTimer = 1;
        }
    } else
        ayylmaoCooldownTimer--;
    
    if (maybenotCooldownTimer <= 0) {
        if (msgContent.toLowerCase() == 'maybe') {
            message.channel.send("or maybe not");
            maybenotCooldownTimer = 1;
        }
    } else
        maybenotCooldownTimer--;

    if (sayoriCooldownTimer <= 0) {
        if (msgContent.toLowerCase().includes('sayori')) {
            message.channel.send("(( sayori.jpg ))");
            sayoriCooldownTimer = 1;
        } 
    } else
        sayoriCooldownTimer--;

    if (message.author.id == CASTIE_ID) {
        let guildID = message.guild.id;
        let channelID = message.channel.id;
        let allowed = (element) => element == channelID;
        
        if (msgContent.includes('sleeve')) {
            message.channel.send({files: attachFile('src/vids/memes/bomb.mov', 'bomb.mov', 'bomb.mov')});
        }
        /*
        if (allowedArkChannels.some(allowed)) {
            sayCute(message);
        }*/
    }

    if (msgContent.toLowerCase().includes('x.com') || msgContent.toLowerCase().includes('twitter.com')) {
        let outStr = new String(msgContent);
        let regex = "/http?s\:\/\//gm";
        outStr = outStr.replaceAll(regex, "");
        outStr = outStr.replaceAll("vxtwitter.com", "x.com").trim();
        outStr = outStr.replaceAll("twitter.com", "x.com");
        outStr = outStr.replaceAll("x.com", "vxtwitter.com");

        let origUrl = msgContent.replaceAll(regex, "");
        outStr = outStr.replaceAll(regex, "");

        if (origUrl == outStr && origUrl != "twitter.com" && origUrl != "x.com")
            return;

        outStr = outStr.replaceAll("vxtwitter.com", "http://vxtwitter.com");

        regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gm;

        let capturedURLs = [];

        outStr.match(regex).forEach((element) => {
            capturedURLs.push(element);
        });

        if (msgContent.toLowerCase()[0] == 'd') {
            message.channel.send(capturedURLs[0]);
        } else
            PostTweetURLs(capturedURLs, message);
    }

    if (msgContent.toLowerCase().includes('tiktok.com')) {
        if (!msgContent.toLowerCase().includes('vxtiktok.com'))
            message.channel.send(msgContent.replaceAll("tiktok.com", "vxtiktok.com"));
    }

    if (msgContent.toLowerCase().includes('pixiv.net')) {
        if (!msgContent.toLowerCase().includes('phixiv.net'))
            message.channel.send(msgContent.replaceAll("pixiv.net", "phixiv.net"));
    }
})

async function main() {
    const commands = [
        //sayoriCommand,
        yuptuneCommand,
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