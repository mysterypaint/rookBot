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
import diceRollCommand from './commands/diceRoll.js';
import diceRollListCommand from './commands/diceRollList.js';
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

var mifuTimer = getRandomInt(200, 250);
var okeiTimer = getRandomInt(300, 350);
var yuptuneTimer = getRandomInt(300, 500);

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

function strIsNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
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

async function consolidateTweets(capturedURLs, allMediaURLs) {
    try {
        capturedURLs.forEach(async thisURL => {
        
            let tweetJsonStr = await fetchTweetData(thisURL);
            let tweetObj = await JSON.parse(tweetJsonStr);
            let mediaURLs = await tweetObj.mediaURLs;
            let username = await tweetObj.user_screen_name;
            
            await mediaURLs.forEach(element => {
                allMediaURLs.push(element);
            });
            

            /*
            const embeddedTweet = await new EmbedBuilder()
            .setColor("#42b6f4")
            .addFields({
            name: `http://twitter.com/` + username, value: ' ',
            });
            await message.channel.send({ embeds: [embeddedTweet] });*/       
        });
    } catch(error) {
        message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => { console.log(err) });
    }

	return new Promise((resolve, reject) => {
		if (capturedURLs.count > 10) return reject(new Error('You can\'t delete more than 10 Messages at a time.'));
		setTimeout(() => resolve('Deleted 10 messages.'), 2_000);
	});
}

async function postTweetURLs(capturedURLs, message) {
    
    const allMediaURLs = [];

    consolidateTweets(capturedURLs, allMediaURLs).then(value => {
        message.channel.send({ //content: "<http://twitter.com/" + username + ">",
            files: allMediaURLs,
        }).catch((err) => { console.log(err) });
    }).catch(error => {
        message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => { console.log(err) });
    });

    
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
            case 'roll':
            case 'rolllist':
                let isRollList = false;
                if (interaction.commandName == 'rolllist')
                    isRollList = true;

                let invalidInput = false;
                let numDice = 1;
                let numSides = 6;
                let diceStr = ` `;
                let diceSides = [1, 1];
                let diceTotalVal = 2;

                try {
                    let inArgs = interaction.options.get('input').value.split('d');

                    if (inArgs.length == 2) {
                        numDice = inArgs[0];
                        numSides = inArgs[1];
                        
                        if (strIsNumeric(numDice) && strIsNumeric(numSides)) {
                            numDice = parseFloat(numDice);
                            numSides = parseFloat(numSides);
                            
                            if (numDice > 0 && numSides > 0) {
                                if (numDice > 15) {
                                    interaction.reply("That's too many dice! (Max: 15)");
                                    break;
                                }

                                diceSides = [];

                                for (let i = 0; i < numDice; i++) {
                                    let thisSideValue = getRandomInt(1, numSides);
                                    diceSides.push(thisSideValue);
                                }

                                diceTotalVal = 0;
                                let diceStrSides = ``;

                                if (isRollList) {
                                    // Handle /rolllist output
                                    let i = 0;
                                    diceSides.forEach(val => {
                                        diceTotalVal += val;
                                        diceStrSides += `d` + (i+1).toString() + ": " + val + "\n";
                                        i++;
                                    });

                                    diceStr = `Total: ` + diceTotalVal + "\n" + diceStrSides;
                                } else {
                                    // Handle /roll output
                                    diceStr = numDice + "d" + numSides + " = ";

                                    let i = 1;
                                    diceSides.forEach(val => {
                                        diceTotalVal += val;
                                        diceStrSides += val;

                                        if (i < numDice)
                                            diceStrSides += " + ";
                                        
                                        i++;
                                    });

                                    diceStr += diceTotalVal + " (" + diceStrSides + ")";

                                }
                            } else
                                invalidInput = true;
                        } else {
                            invalidInput = true;
                        }
                    } else {
                        invalidInput = true;
                    }
                } catch (err) {
                    invalidInput = true;
                }

                if (invalidInput) {
                    interaction.reply("Invalid input.");
                } else {
                    
                    /*
                    interaction.reply('One sec...');
                    interaction.deleteReply();
                    */
                    
                    let dieOrDice = " dice ";

                    if (numDice == 1)
                        dieOrDice = " die ";

                    const diceRollEmbed = new EmbedBuilder()
                    .setTitle(interaction.user.displayName + " rolled " + numDice + dieOrDice + "with " + numSides + " sides:")
                    .setColor(0x0099FF)
                    .addFields(
                        { name: ' ', value: diceStr },
                    );
                    
                    //await interaction.reply({ content: 'Secret Pong!', ephemeral: true });
                    
                    interaction.reply({
                        embeds: [diceRollEmbed],
                        //files: attachFile('src/img/memes/Yuptune.gif', 'Yuptune.gif', 'Yuptune')
                    })
                }
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
        if (ARK_WHITELISTED_CHANNEL_IDS.includes(message.channel.id)) {
            let targChannel = message.channel;//.channels.cache.get(randomWhitelistedChannel);

            sayMifuShrimp(targChannel);
            mifuTimer = getRandomInt(200, 250);
        }
    }
    
    okeiTimer--;
    if (okeiTimer <= 0) {
        if (ARK_WHITELISTED_CHANNEL_IDS.includes(message.channel.id)) {
            let targChannel = message.channel;//.channels.cache.get(randomWhitelistedChannel);

            sayOkei(targChannel);
            okeiTimer = getRandomInt(300, 350);
        }
    }
    
    yuptuneTimer--;
    if (yuptuneTimer <= 0) {
        let targChannel = message.client.channels.cache.get(ARK_CHANNEL_ID_ROOM3);
        sendLocalFile(targChannel, 'src/img/memes/Yuptune.gif', 'Yuptune.gif', 'Yuptune');
        yuptuneTimer = getRandomInt(300, 500);
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
                    message.channel.send("Nice").catch((err) => { console.log(err) });
            }
        } else if (!isValidHttpUrl(message)) {
            let reg = /<:*.+:\d+>/gm;
            var tmpMsg = new String(message);
            tmpMsg = tmpMsg.replace(reg, '').trim();
            console.log(tmpMsg);
            if (tmpMsg.includes('69'))
                message.channel.send("Nice").catch((err) => { console.log(err) });
        }
    }

    if (msgContent.toLowerCase().includes('castle') || msgContent.includes('castIe')) {
        message.react('<:mashiropray:' + MASHIRO_PRAY_EMOTE_ID + '>');
    }

    if (ayylmaoCooldownTimer <= 0) {
        if (msgContent.toLowerCase() == 'ayy') {
            message.channel.send("ayy lmao").catch((err) => { console.log(err) });
            ayylmaoCooldownTimer = 1;
        }
    } else
        ayylmaoCooldownTimer--;
    
    if (maybenotCooldownTimer <= 0) {
        if (msgContent.toLowerCase() == 'maybe') {
            message.channel.send("or maybe not").catch((err) => { console.log(err) });
            maybenotCooldownTimer = 1;
        }
    } else
        maybenotCooldownTimer--;

    if (sayoriCooldownTimer <= 0) {
        if (msgContent.toLowerCase().includes('sayori')) {
            message.channel.send("(( sayori.jpg ))").catch((err) => { console.log(err) });
            sayoriCooldownTimer = 1;
        } 
    } else
        sayoriCooldownTimer--;

    if (message.author.id == CASTIE_ID) {
        let guildID = message.guild.id;
        let channelID = message.channel.id;
        let allowed = (element) => element == channelID;
        
        if (msgContent.includes('sleeve')) {
            message.channel.send({files: attachFile('src/vids/memes/bomb.mov', 'bomb.mov', 'bomb.mov')}).catch((err) => { console.log(err) });
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

        var isVXTwit = false;
        var isVXMeme = false;

        if (origUrl == outStr && origUrl != "twitter.com" && origUrl != "x.com") {
            if (msgContent.toLowerCase().includes('vxtwitter.com')) {
                var posAfterDomain = msgContent.toLowerCase().indexOf('vxtwitter.com') + 1;
                isVXTwit = true;
                if (msgContent.length < posAfterDomain) {
                    // meme
                    isVXMeme = true;
                    message.channel.send('Correct.').catch((err) => { console.log(err) });
                } else if (msgContent[posAfterDomain + 12] != '/') {
                    // meme
                    isVXMeme = true;
                    message.channel.send('Correct.').catch((err) => { console.log(err) });
                }
            }
        } else {
            if (msgContent.toLowerCase().includes('x.com')) {
                var posAfterDomain = msgContent.toLowerCase().indexOf('x.com') + 1;
                if (msgContent.length < posAfterDomain) {
                    // meme
                    isVXMeme = true;
                    message.channel.send('vxtwitter.com').catch((err) => { console.log(err) });
                } else if (msgContent[posAfterDomain + 4] != '/') {
                    // meme
                    isVXMeme = true;
                    message.channel.send('vxtwitter.com').catch((err) => { console.log(err) });
                }
            } else if (msgContent.toLowerCase().includes('twitter.com')) {
                var posAfterDomain = msgContent.toLowerCase().indexOf('twitter.com') + 1;
                if (msgContent.length < posAfterDomain) {
                    // meme
                    isVXMeme = true;
                    message.channel.send('vxtwitter.com').catch((err) => { console.log(err) });
                } else if (msgContent[posAfterDomain + 10] != '/') {
                    // meme
                    isVXMeme = true;
                    message.channel.send('vxtwitter.com').catch((err) => { console.log(err) });
                }
            }
        }

        if (!isVXTwit && !isVXMeme) {
            outStr = outStr.replaceAll("vxtwitter.com", "http://vxtwitter.com");

            regex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gm;

            let capturedURLs = [];

            outStr.match(regex).forEach((element) => {
                capturedURLs.push(element);
            });

            var isMentionedDomain = (msgContent.toLowerCase() === 'twitter.com' | msgContent.toLowerCase() === 'x.com');
            if (msgContent.toLowerCase().startsWith("vx") || isMentionedDomain || capturedURLs.length <= 0) {
                if (isMentionedDomain)
                    message.channel.send('vxtwitter.com').catch((err) => { console.log(err) });
                else
                    message.channel.send(capturedURLs[0]).catch((err) => { console.log(err) });
            } else
                postTweetURLs(capturedURLs, message);
        }
    }


    if (msgContent.toLowerCase().includes('tiktok.com')) {
        if (!msgContent.toLowerCase().includes('vxtiktok.com'))
            message.channel.send(msgContent.replaceAll("tiktok.com", "vxtiktok.com")).catch((err) => { console.log(err) });
    }

    if (msgContent.toLowerCase().includes('pixiv.net')) {
        if (!msgContent.toLowerCase().includes('phixiv.net'))
            message.channel.send(msgContent.replaceAll("pixiv.net", "phixiv.net")).catch((err) => { console.log(err) });
    }
})

async function main() {
    const commands = [
        //sayoriCommand,
        yuptuneCommand,
        diceRollCommand,
        diceRollListCommand,
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