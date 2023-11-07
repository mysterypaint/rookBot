import {
  config
} from 'dotenv';
import {
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  InteractionType,
  Routes,
  SlashCommandBuilder,
} from 'discord.js';
import {
  REST
} from '@discordjs/rest';
import sayoriCommand from './commands/sayori.js';
import diceRollCommand from './commands/diceRoll.js';
import diceRollListCommand from './commands/diceRollList.js';
import yuptuneCommand from './commands/yuptune.js';
import fetch from 'node-fetch';

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

const rest = new REST({
  version: '10'
}).setToken(TOKEN);

// Declare constants
const mifuChance = 0.001; // 0.2% chance of triggering mifushrimp
const okeiChance = 0.0001; // 0.1% chance of triggering okei
const yuptuneChance = 0.00001; // Approx ~1/700 (0.014) chance of triggering yuptune

// Declare vars
var ayylmaoCooldownTimer = 0;
var maybenotCooldownTimer = 0;
var sayoriCooldownTimer = 0;
var numTwitSites = 0;
var numVxTwitSites = 0;
var numPixivSites = 0;
var numPhixivSites = 0;
var numTiktokSites = 0;
var numVxTiktokSites = 0;


var atLeastOneValidURL = false;

var sitesToParse = [];
var collectedTwitSites = [];

var tweetMediaCache = [];
var tweetUsernameCache = [];
var tweetOriginURLCache = [];
var pixivMediaCache = [];
var tiktokURLCache = [];

// Declare enums
const Websites = {
  Twitter: 0,
  VxTwitter: 1,
  Pixiv: 2,
  Phixiv: 3,
  Tiktok: 4,
  VxTiktok: 5,
}

// Wait for the client to get ready; print to console when it logs in
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

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

/**
 * Checks if the string is a valid numerical value (e.g. "5247" = true, "d5832" = false)
 */
function strIsNumeric(str) {
  if (typeof str != "string")
    return false;
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

/**
 * Removes all URLs from the input string and returns the modified string
 */
function eatAllURLs(inStr) {
  let reg = /<:*.+:\d+>/gm;
  return inStr.replace(reg, '').trim();
}

/**
 * Removes all Discord-formatted emotes from the input string and returns the modified string
 */
function eatAllEmotes(inStr) {
  let reg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gm;
  return inStr.replace(reg, '').trim();
}

/**
 * Removes all Discord-formatted pings from the input string and returns the modified string
 */
function eatAllPings(inStr) {
  let reg = /<@(\&)?\d+>/gm;
  return inStr.replace(reg, '').trim();
}

/**
 * Calculates probability of the input value (e.g. 0.2 = 2% chance)
 * Returns true if it succeeded; false if it fails
 */
function probability(n) {
  return !!n && Math.random() <= n;
};

/**
 * Checks if the input string is a valid URL or not
 */
function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

/**
 * Pre-formats a Discord attachment for quick prepartion to generate posts with attachments
 */
function attachFile(fPath, name, description) {
  return [{
    attachment: fPath,
    name: name,
    description: description,
  }];
}

/**
 * Posts a message on Discord with an attachment uploaded from the bot's local resources
 */
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

/**
 * Sends the :mifushrimp: emote to the input Discord channel
 */
function sayMifuShrimp(channel) {
  channel.send('<:mifushrimp:' + MIFU_SHRIMP_EMOTE_ID + '>');
}

/**
 * Sends the :okei: emote to the input Discord channel
 */
function sayOkei(channel) {
  channel.send('<:okei:' + OKEI_EMOTE_ID + '>');
}

/**
 * Sends a cute message to the input Discord channel
 */
function sayCute(message) {
  const msgContent = message.content;
  if (msgContent.toLowerCase().includes('cute')) {
    message.reply({
      content: 'cute... <:mashiropray:' + MASHIRO_PRAY_EMOTE_ID + '>'
    });
  }
}

/**
 * Fetches and returns JSON data from the VXTwitter API
 */
async function fetchTweetData(twitURL) {
  try {
    twitURL = twitURL.replace(/(https?:\/\/)?(www\.)?((vx)?twitter|x).com/i, "https://api.vxtwitter.com");
    const response = await fetch(twitURL);

    if (!response.ok) {
      console.log(`HTTP error: ${response.status}`);
      return -2;
    }
    // after this line, our function will wait for the `response.json()` call to be settled
    // the `response.json()` call will either return the parsed JSON object or throw an error

    const jsonDat = await response.json();
    const jString = await JSON.stringify(jsonDat);
    return jString;
  } catch (error) {
    console.log(`Could not get products: ${error}`);
    return -1;
  }
}

/**
 * Fetches and returns JSON data from the Phixiv API
 */
async function fetchPixivData(inURL) {

  try {
    let regex = await /p[h]?ixiv\.net\/(\w\w)\/artworks\/(\d+)/ig;
    let regMatches = await regex.exec(inURL); //inURL.matchAll(regex);
    let lang = await regMatches[1];
    let artID = await regMatches[2];
    let pixivURL = await `https://phixiv.net/api/info?id=` + artID + `&language=` + lang;
    let response = await fetch(await pixivURL);

    if (!response.ok) {
      console.log(`HTTP error: ${response.status}`);
      return -2;
    }
    const jsonDat = await response.json();
    return jsonDat;
  } catch (error) {
    console.log(`Could not get products: ${error}`);
  }
}

async function fetchPixivCacheFromURL(inURL) {
  try {
    // Grab tweet data from the URL as a JSON object
    var jsonData = await fetchPixivData(inURL);

    // after this line, our function will wait for the `response.json()` call to be settled
    // the `response.json()` call will either return the parsed JSON object or throw an error

    let jString = await JSON.stringify(jsonData);
    let pixObj = await JSON.parse(jString);

    // We want the tweeter's username, and all of the media URLs from the tweet
    let mediaURLs = await pixObj.image_proxy_urls;
    let authorName = await pixObj.author_name;
    let authorID = await pixObj.author_id;
    let artURL = await pixObj.url;

    return [await mediaURLs, authorName, authorID, artURL];
  } catch (error) {
    /*
    message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => {
      console.log(err)
    });*/
    console.error(`Could not get products: ${error}`);
  }
}

async function fetchTweetCacheFromURL(inURL) {
  try {
      // Grab tweet data from the URL as a JSON object
      const jString = await fetchTweetData(inURL);

      // after this line, our function will wait for the `response.json()` call to be settled
      // the `response.json()` call will either return the parsed JSON object or throw an error

      let tweetObj = await JSON.parse(jString);

      // We want the tweeter's username, and all of the media URLs from the tweet
      let mediaURLs = await tweetObj.mediaURLs;
      let username = await "@" + tweetObj.user_screen_name;
      let url = await tweetObj.tweetURL;
      
      return [mediaURLs, username, url];
  } catch (error) {
    /*
    message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => {
      console.log(err)
    });*/
    console.error(`Could not get products: ${error}`);
  }
}

/**
 * Posts all fetched media URLs from Pixiv to Discord
 */
async function postPixivURLs(message, gatheredPostData) {
  // If we are not about to post Tiktoks, delete this message (otherwise, let the Tiktok post code do it for us: We don't want to accidentally delete two messages!)
  if (numTiktokSites <= 0 && numVxTiktokSites <= 0)
    message.delete();

  //gatheredPostData = [mediaURLs, authorName, authorID, artURL]
  const allPosts = await gatheredPostData[1];
  var hitPostLimit = false;

  // Loop through every single Pixiv post and post them all in a chain
  for (var i = 0; i < allPosts.length; i++) {
    if (i >= 4) {
      hitPostLimit = true;
      break;
    }
    var thisPost = await allPosts[i];
    var thisMediaURLCollection = await thisPost[0];
    var thisPixAuthorName = await thisPost[1];
    var thisAuthorID = await thisPost[2];
    var thisArtURL = await thisPost[3];
    var thisAuthorLang = await thisArtURL.match(/pixiv\.net\/\w\w\/a/gm)[0].substring(10,12);
    var thisAuthorURL = await "https://www.pixiv.net/" + thisAuthorLang + "/users/" + thisAuthorID;

    var outputMedia = [];

    for(const url of await thisMediaURLCollection) {
      outputMedia.push(url);
    }

    // Claim who posted the message
    var msgContent = await "Artist: " + thisPixAuthorName + " (" + wrapURL(thisAuthorURL) + ")" + "   |   Shared by: " + message.member.user.tag + "   |   " + wrapURL(thisArtURL);
    try {
      await message.channel.send({
        content: msgContent,
        files: await thisMediaURLCollection,
      }).catch((err) => {
        switch(err.code) {
          case 50035:
            msgContent = "**Too many images to combine! Only posting the first 4. (Max: 10)**\n\n" + msgContent;
            message.channel.send({
              content: msgContent,
              files: [thisMediaURLCollection[0], thisMediaURLCollection[1], thisMediaURLCollection[2], thisMediaURLCollection[3]],
            });
            break;
        }
      });
    } catch (error) {
      message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => {
        console.log(err)
      });
    }
  }
  if (hitPostLimit) {
    try {
      message.channel.send("Too many posts in a single message! Try sending fewer. (Max: 4)");
    } catch (error) {
      console.log(err);
    }
  }
}

/**
 * Posts all fetched media URLs from Tiktok to Discord
 */
async function postTiktokURLs(message, inCache) {
  message.delete();
  var urlCache = await inCache[2];
  var outMsg = message.member.user.tag + " posted: ";
  for (var i = 0; i < urlCache.length; i++) {
    var thisURL = urlCache[i];

    if (i < urlCache.length - 1)
      outMsg += thisURL + " | ";
    else
      outMsg += thisURL;
  }

  try {
    await message.channel.send({
      content: outMsg,
    });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Posts all fetched media URLs from Twitter to Discord
 */
async function postTweetURLs(message, gatheredPostData) {
  var msgContent = "";
  
  const allMediaURLs = await gatheredPostData[0][0];
  const allUsernames = await gatheredPostData[0][1];
  const allOriginURLs = await gatheredPostData[0][2];
  
  // Claim who posted the message if we're also posting Pixiv or Tiktok URLs, because the user's message is about to get deleted
  if (numTiktokSites > 0 || numPixivSites > 0 || numVxTiktokSites > 0 || numPhixivSites > 0) {
    msgContent = message.member.user.tag + " posted: " + wrapAllURLs(allOriginURLs);
  }

  try {
    await message.channel.send({
      content: msgContent,
      files: await allMediaURLs,
    }).catch((err) => {
      switch(err.code) {
        case 50035:
          msgContent = "**Too many images to combine! Only posting the first 4. (Max: 10)**\n\n" + msgContent;
          message.channel.send({
            content: msgContent,
            files: [allMediaURLs[0], allMediaURLs[1], allMediaURLs[2], allMediaURLs[3]],
          });
          break;
      }
    });
  } catch (error) {
    message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => {
      console.log(err)
    });
  }
}

/**
 * Iterates through each Twitter URL in the capturedURLs[] array,
 * fetches data from each of them,
 * and stores that data in the allMediaURLs[] array.
 */
async function consolidatePixiv(capturedURLs, unmodifiedURLs, allMediaURLs, authorMetadata) {
  try {
    capturedURLs.forEach(async thisURL => {
      if (thisURL.length > 2) {
        let pixivJsonStr = await fetchPixivData(thisURL);
        //console.log(pixivJsonStr);
        let pixObj = await JSON.parse(pixivJsonStr);
        //console.log(pixObj);
        let mediaURLs = await pixObj.image_proxy_urls;
        let authorName = await pixObj.author_name;
        let authorID = await pixObj.author_id;

        await mediaURLs.forEach(element => {
          allMediaURLs.push(element);
        });

        await authorMetadata.push(authorName, authorID, unmodifiedURLs[capturedURLs.indexOf(thisURL)]);
      } else {
        authorMetadata.push(thisURL);
      }
    });
  } catch (error) {
    message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => {
      console.log(err)
    });
  }

  return new Promise((resolve, reject) => {
    if (capturedURLs.count > 10) return reject(new Error('You can\'t capture more than 10 Tweets at a time.'));
    setTimeout(() => resolve('Posted 10 tweets.'), 2_000);
  });
}

/**
 * Posts all fetched media URLs from Twitter to Discord
 */
async function getPixivPostData(capturedURLs, unmodifiedURLs, message) {

  const allMediaURLs = [];
  const authorMetadata = [];
  var contentOut;

  if (capturedURLs.length <= 0)
    return undefined;

  consolidatePixiv(capturedURLs, unmodifiedURLs, allMediaURLs, authorMetadata).then(value => {
    contentOut = "Artist: " + authorMetadata[1] + " (<https://www.pixiv.net/" + authorMetadata[0] + "/users/" + authorMetadata[2] + ">)" + "   |   Shared by: " + message.author.displayName + "\n<" + authorMetadata[3] + ">";

    let outputMedia = [];
    for (var i = 0; i < allMediaURLs.length; i++) {
      if (i > 3)
        break;
      outputMedia.push(allMediaURLs[i]);
    }

    message.channel.send({ //content: "<http://twitter.com/" + username + ">",
      content: contentOut,
      files: outputMedia,
    }).catch((err) => {
      console.log(err)
    });

    /*
    return new Promise(function(resolve, reject) {
      // Only `delay` is able to resolve or reject the promise
      setTimeout(function() {
        resolve([contentOut, allMediaURLs]); // After 3 seconds, resolve the promise with value [contentOut, allMediaURLs]
      }, 3000);
    });*/
  }).catch(error => {
    console.log(error);
    message.channel.send("Error grabbing post data :sob: :broken_heart:").catch((err) => {
      console.log(err)
    });
  });
}

function scrapeURLs(inStr, website) {
  let collectedURLs = [];

  let regex = /.+/gm;

  inStr = inStr.replaceAll(' ', '\n');
  inStr = inStr.replaceAll('https://', '');
  inStr = inStr.replaceAll('http://', '');
  regex = /(https?:\/\/(www\.)?)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gm;

  try {
    inStr.match(regex).forEach((element) => {
      collectedURLs.push("https://" + element);
    });
  } catch (err) {
    // No URLs were found; Return -1
    return -1;
  }

  return collectedURLs;
}

function wrapURL(inStr, regex) {
  if (regex == undefined)
    regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
  return inStr.replace(regex, function(url) {
    return '<' + url.trim() + '>';
  });
}

function wrapAllURLs(inStrArray) {
  const regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
  var urlCollection = "";

  try {
    for (var i = 0; i < inStrArray.length; i++) {
      var thisURL = inStrArray[i];
      urlCollection += wrapURL(thisURL, regex);

      if (i < inStrArray.length - 1)
        urlCollection += " | ";
    }
    return urlCollection;
  } catch (err) {
    console.log("Error wrapping string array: " + inStrArray);
    return 'undefined';
  }
}

function getTwitterCache() {
  return tweetMediaCache;
}

/**
 * Detects and caches all URLs to sitesToParse[]
 */
function identifyURLs(inURL, regex, sitesToParse, websiteType) {
  var detectedSites = inURL.match(regex);

  if (detectedSites != null) {
    sitesToParse.push(detectedSites[0], websiteType);

    switch (websiteType) {
      case Websites.Twitter:
        collectedTwitSites.push(detectedSites[0]);
        atLeastOneValidURL = true;
        numTwitSites++;
        break;
      case Websites.VxTwitter:
        collectedTwitSites.push(detectedSites[0]);
        atLeastOneValidURL = true;
        numVxTwitSites++;
        break;
      case Websites.Pixiv:
        atLeastOneValidURL = true;
        numPixivSites++;
        break;
      case Websites.Phixiv:
        atLeastOneValidURL = true;
        numPhixivSites++;
        break;
      case Websites.Tiktok:
        atLeastOneValidURL = true;
        numTiktokSites++;
        break;
      case Websites.VxTiktok:
        atLeastOneValidURL = true;
        numVxTiktokSites++;
        break;
    }
  }
}

async function parseAllSites(sitesToParse, numTwitSites, numVxTwitSites, numPixivSites, numPhixivSites) {
  tweetMediaCache = [];
  tweetUsernameCache = [];
  tweetOriginURLCache = [];
  pixivMediaCache = [];
  tiktokURLCache = [];

  for (var i = 0; i < sitesToParse.length; i += 2) {
    var thisURL = sitesToParse[i];
    var websiteType = sitesToParse[i + 1];

    switch (websiteType) {
      case Websites.Twitter:
      case Websites.VxTwitter:
        // Only handle Twitter URLs if there is at least one non-VX Tweet that was scraped
        if (numTwitSites > 0) {
          thisURL = thisURL.replaceAll('vxtwitter', 'x');
          thisURL = thisURL.replaceAll('twitter', 'x');
          thisURL = thisURL.replaceAll('x', 'vxtwitter');

          // Promise a tweet cache, and then store the tweet's media in our tweetMediaCache[]
          const res = await fetchTweetCacheFromURL(thisURL);
          for (const mediaURL of res[0])
            tweetMediaCache.push(mediaURL);
          
          tweetUsernameCache.push(res[1]); // tweet username
          tweetOriginURLCache.push(res[2]); // tweet origin URL
        }
        break;
        case Websites.Pixiv:
        case Websites.Phixiv:
        // Only handle Pixiv URLs if there is at least one non-Phixiv Tweet that was scraped
        if (numPixivSites > 0) {
          thisURL = thisURL.replaceAll('phixiv', 'pixiv');

          // Promise a pixiv metadata cache, and then store the data to our pixivMediaCache[]
          const foundMediaMetadata = await fetchPixivCacheFromURL(thisURL);
          pixivMediaCache.push(foundMediaMetadata);
        }
        break;
        case Websites.Tiktok:
          thisURL = thisURL.replaceAll('tiktok', 'vxtiktok');
          tiktokURLCache.push(thisURL);
          break;
        case Websites.VxTiktok:
          tiktokURLCache.push(thisURL);
          break;
    }
  }

  return [[await tweetMediaCache, await tweetUsernameCache, await tweetOriginURLCache], await pixivMediaCache, await tiktokURLCache];
}

/// Listens to every single Discord bot-slash-message sent to the server the bot is on (e.g. "/roll <value>")
client.on(`interactionCreate`, (interaction) => {
  // Handle Slash commands
  if (interaction.isChatInputCommand()) {
    switch (interaction.commandName) {
      case 'sayori':
        interaction.reply({
          files: attachFile('src/img/memes/sayori.png', 'sayori.png', 'Sayori')
        })
        break;
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

                /// Format the output text of this command, based on whether the user called /roll or /rolllist
                if (isRollList) {
                  // Handle /rolllist output
                  let i = 0;
                  diceSides.forEach(val => {
                    diceTotalVal += val;
                    diceStrSides += `d` + (i + 1).toString() + ": " + val + "\n";
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
          /// The user's input was valid: We will format (and print) the results by replying directly to the user

          // First, format the results
          let dieOrDice = " dice ";

          if (numDice == 1)
            dieOrDice = " die ";

          const diceRollEmbed = new EmbedBuilder()
            .setTitle(interaction.user.displayName + " rolled " + numDice + dieOrDice + "with " + numSides + " sides:")
            .setColor(0x0099FF)
            .addFields({
              name: ' ',
              value: diceStr
            }, );

          // Now, reply to the person who called the command
          interaction.reply({
            embeds: [diceRollEmbed],
          })
        }
        break;
    }
  }
});

/// Listens to every single Discord message sent to the server the bot is on
client.on('messageCreate', async (message) => {
  if (message.author.bot)
    return;

  // Log the message to the console
  console.log(message.createdAt.toDateString(), `${message.author.tag}:`, `"${message.content}"`);

  var msgContent = message.content;
  let regex;

  // Small chance to post :mifushrimp: emote to a channel; Send it to the channel that triggered the successful probability
  if (probability(mifuChance)) {
    if (ARK_WHITELISTED_CHANNEL_IDS.includes(message.channel.id)) {
      let targChannel = message.channel; //.channels.cache.get(randomWhitelistedChannel);

      sayMifuShrimp(targChannel);
    }
  }

  // Same as above, but for :okei:
  if (probability(okeiChance)) {
    if (ARK_WHITELISTED_CHANNEL_IDS.includes(message.channel.id)) {
      let targChannel = message.channel; //.channels.cache.get(randomWhitelistedChannel);
      sayOkei(targChannel);
    }
  }

  // Same as above, but for Yuptune.gif. Posts it *specifically* in the #room3 channel
  if (probability(yuptuneChance)) {
    let targChannel = message.client.channels.cache.get(ARK_CHANNEL_ID_ROOM3);
    sendLocalFile(targChannel, 'src/img/memes/Yuptune.gif', 'Yuptune.gif', 'Yuptune');
  }

  // Replies "nice" to anyone who says "69". Excludes edgecase, like when 69 is present in URLs, Emotes, Pings, or Embeds
  if (msgContent.includes('69')) {
    if (message.embeds.length > 0) {
      var embed = message.embeds[0];
      if (!embed.image) {
        var tmpMsg = new String(message);

        tmpMsg = eatAllURLs(tmpMsg);
        tmpMsg = eatAllEmotes(tmpMsg);
        tmpMsg = eatAllPings(tmpMsg);

        console.log(tmpMsg);
        if (tmpMsg.length > 0 && tmpMsg.includes('69'))
          message.channel.send("Nice").catch((err) => {
            console.log(err)
          });
      }
    } else if (!isValidHttpUrl(message)) {
      var tmpMsg = new String(message);
      tmpMsg = eatAllURLs(tmpMsg);
      tmpMsg = eatAllEmotes(tmpMsg);
      tmpMsg = eatAllPings(tmpMsg);

      if (tmpMsg.includes('69'))
        message.channel.send("Nice").catch((err) => {
          console.log(err)
        });
    }
  }

  // React to Discord messages that say "castle" or "castIe" (not case-sensitive) with :mashiropray:
  if (msgContent.toLowerCase().includes('castle') || msgContent.includes('castIe')) {
    message.react('<:mashiropray:' + MASHIRO_PRAY_EMOTE_ID + '>');
  }

  // Replies "ayy lmao" to anyone who says "ayy"
  if (ayylmaoCooldownTimer <= 0) {
    if (msgContent.toLowerCase() === 'ayy') {
      message.channel.send("ayy lmao").catch((err) => {
        console.log(err)
      });
      ayylmaoCooldownTimer = 1;
    }
  } else
    ayylmaoCooldownTimer--;

  // Replies "or maybe not" to anyone who says "maybe"
  if (maybenotCooldownTimer <= 0) {
    if (msgContent.toLowerCase() === 'maybe') {
      message.channel.send("or maybe not").catch((err) => {
        console.log(err)
      });
      maybenotCooldownTimer = 1;
    }
  } else
    maybenotCooldownTimer--;

  // Replies "(( sayori.jpg ))" to anyone who mentions "sayori" anywhere in their message
  if (sayoriCooldownTimer <= 0) {
    if (msgContent.toLowerCase().includes('sayori')) {
      message.channel.send({
        files: attachFile('src/img/memes/hang-in-there-doki-doki-literature-club.png', 'sayori.png', 'Sayori')
      }).catch((err) => {
        console.log(err)
      });
      sayoriCooldownTimer = 1;
    }
  } else
    sayoriCooldownTimer--;

  /// Handle messages *specifically* sent by user castIe
  if (message.author.id == CASTIE_ID) {
    let guildID = message.guild.id;
    let channelID = message.channel.id;
    let allowed = (element) => element == channelID;

    // Sleeve meme
    if (msgContent.includes('sleeve')) {
      message.channel.send({
        files: attachFile('src/vids/memes/bomb.mov', 'bomb.mov', 'bomb.mov')
      }).catch((err) => {
        console.log(err)
      });
    }
  }

  // Populate the cache with scraped URLs from Twitter, Pixiv, and Tiktok
  let scrapedURLs = await scrapeURLs(msgContent);
  atLeastOneValidURL = false;
  numTwitSites = 0;
  numVxTwitSites = 0;
  numPixivSites = 0;
  numPhixivSites = 0;
  numTiktokSites = 0;
  numVxTiktokSites = 0;

  sitesToParse = [];
  collectedTwitSites = [];

  if (scrapedURLs != -1) {
    for(const thisURL of scrapedURLs) {
      // Detect and cache all twitter.com/x.com URLs to sitesToParse[]
      identifyURLs(thisURL, /^(http?s:\/\/)?(twitter|x)\.com\/[a-z_A-Z\d]+\/status\/\d+/gm, sitesToParse, Websites.Twitter);

      // Detect and cache all vxtwitter.com URLs to tweetsToParse[]
      identifyURLs(thisURL, /^(http?s:\/\/)?(vxtwitter)\.com\/[a-z_A-Z\d]+\/status\/\d+/gm, sitesToParse, Websites.VxTwitter);

      // Detect and cache all pixiv.net art URLs to sitesToParse[]
      identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?pixiv.net\/\w\w\/artworks\/\d.+/gm, sitesToParse, Websites.Pixiv);

      // Detect and cache all phixiv.net art URLs to sitesToParse[]
      identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?phixiv.net\/\w\w\/artworks\/\d.+/gm, sitesToParse, Websites.Phixiv);

      // Detect and cache all tiktok.com URLs to sitesToParse[]
      identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?tiktok.com\/(t\/[a-zA-Z\d]+|@[a-zA-Z_\d]+\/video\/\d+)/gm, sitesToParse, Websites.Tiktok);

      // Detect and cache all tiktok.com URLs to sitesToParse[]
      identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?vxtiktok.com\/(t\/[a-zA-Z\d]+|@[a-zA-Z_\d]+\/video\/\d+)/gm, sitesToParse, Websites.VxTiktok);
    }

    // Loop through every single scraped URL and prepare a "To Post" cache for each website

    console.log("scrapedURLs: " + scrapedURLs);

    const gatheredPostData = await parseAllSites(sitesToParse, numTwitSites, numVxTwitSites, numPixivSites, numPhixivSites);

      regex = /^(vx)?twitter|x.com/gm;
      if (numTwitSites > 0) {
        if (message.content.startsWith('vx ')) {
          var outMsg = "";
          for (var twitSite of collectedTwitSites) {
            var rxTmp = /(vx)?twitter.com/i;
            outMsg += twitSite.replace(rxTmp, 'vxtwitter.com') + "\n";
          }
          message.channel.send({content: outMsg});
        } else
          postTweetURLs(message, await gatheredPostData);
      } else if (message.content.match(regex)) {
        // Handle memes
        if (message.content.includes(`vxtwitter.com`))
          message.channel.send(`Correct.`);
        else
          message.channel.send(`vxtwitter.com`);
      }

      regex = /^p(h)?ixiv.net/gm;
      if (numPixivSites > 0)
        postPixivURLs(message,  await gatheredPostData);
      else if (message.content.match(regex)){
        // Handle memes
        if (message.content.includes(`phixiv.net`))
          message.channel.send(`Correct.`);
        else
          message.channel.send(`phixiv.net`);
      }

      regex = /^(vx)?tiktok.com/gm;
      if (numTiktokSites > 0)
        postTiktokURLs(message,  await gatheredPostData);
      else if (message.content.match(regex)) {
        // Handle memes
        if (message.content.includes(`vxtiktok.com`))
        message.channel.send(`Correct.`);
      else
        message.channel.send(`vxtiktok.com`);
      }
  }
});

async function main() {
  // Init all the Slash commands
  const commands = [
    sayoriCommand,
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