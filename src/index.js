import { config } from 'dotenv';
import { Client, GatewayIntentBits } from 'discord.js';

config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
const TOKEN = process.env.DISCORD_TOKEN;
const CASTIE_ID = process.env.CASTIE_ID;
const ARK_SERVER_ID = process.env.ARK_SERVER_ID;
const ARK_CHANNEL_ID_BOTS = process.env.ARK_CHANNEL_ID_BOTS;
const ARK_CHANNEL_ID_DA_CHAT = process.env.ARK_CHANNEL_ID_DA_CHAT;
const ARK_CHANNEL_ID_HOTCHIP = process.env.ARK_CHANNEL_ID_HOTCHIP;

const PERSONAL_SERVER_ID = process.env.PERSONAL_SERVER_ID;
const PERSONAL_CHANNEL_ID_GENERAL = process.env.PERSONAL_CHANNEL_ID_GENERAL;
const PERSONAL_CHANNEL_ID_N = process.env.PERSONAL_CHANNEL_ID_N;

const MASHIRO_PRAY_EMOTE_ID = process.env.MASHIRO_PRAY_EMOTE_ID;

const allowedArkChannels = [ ARK_CHANNEL_ID_BOTS, ARK_CHANNEL_ID_DA_CHAT, ARK_CHANNEL_ID_HOTCHIP];


client.login(TOKEN);

function sayCute(message) {
    const msgLower = message.content.toLowerCase();
    
    if (msgLower.includes('cute')) {
        message.reply({content: 'cute... <:mashiropray:${MASHIRO_PRAY_EMOTE_ID}>'});
    }
}

client.on('messageCreate', (message) => {
    console.log(`${message.author.tag} has said`, `"${message.content}"`, `on`, message.createdAt.toDateString());
    
    const msgLower = message.content.toLowerCase();
    const msgContent = message.content;
    
    if (message.author.id == CASTIE_ID) {
        let serverID = message.guild.id;
        let channelID = message.channel.id;

        const allowed = (element) => element == channelID;

        if (serverID != ARK_SERVER_ID) {
            
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