import {
    config
  } from 'dotenv';
  import {
    Client,
    EmbedBuilder,
    GatewayIntentBits,
    InteractionType,
    Routes,
    SlashCommandBuilder,
  } from 'discord.js';
  import {
    REST
  } from '@discordjs/rest';
  //import sayoriCommand from './commands/sayori.js';
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
  const mifuChance = 0.02; // 0.2% chance of triggering mifushrimp
  const okeiChance = 0.01; // 0.1% chance of triggering okei
  const yuptuneChance = 0.0014; // Approx ~1/700 (0.014) chance of triggering yuptune
  
  // Declare vars
  var ayylmaoCooldownTimer = 0;
  var maybenotCooldownTimer = 0;
  var sayoriCooldownTimer = 0;
  
  // Wait for the client to get ready; print to console when it logs in
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
    let reg = /<@\&\d+>/gm;
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
    twitURL = twitURL.replaceAll("vxtwitter\.com", "api.vxtwitter.com");
    const response = await fetch(twitURL);
    const data = await response.json();
  
    var jString = JSON.stringify(data);
    return jString;
  }
  
  /**
   * Iterates through each Twitter URL in the capturedURLs[] array,
   * fetches data from each of them,
   * and stores that data in the allMediaURLs[] array.
   */
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
  async function postTweetURLs(capturedURLs, message) {
  
    const allMediaURLs = [];
  
    consolidateTweets(capturedURLs, allMediaURLs).then(value => {
      message.channel.send({ //content: "<http://twitter.com/" + username + ">",
        files: allMediaURLs,
      }).catch((err) => {
        console.log(err)
      });
    }).catch(error => {
      message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => {
        console.log(err)
      });
    });
  }
  
  /// Listens to every single Discord bot-slash-message sent to the server the bot is on (e.g. "/roll <value>")
  client.on(`interactionCreate`, (interaction) => {
    // Handle Slash commands
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
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
  client.on('messageCreate', (message) => {
    if (message.author.bot)
      return;
  
    // Log the message to the console
    console.log(message.createdAt.toDateString(), `${message.author.tag}:`, `"${message.content}"`);
  
    var msgContent = message.content;
  
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
        message.channel.send("(( sayori.jpg ))").catch((err) => {
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
  
    /// Detects any x.com or twitter.com messages, then indirectly replies with all of the images from the provided URL(s)
    // If the Domains are simply mentioned and not actual URLs, we also handle snarky meme replies from the bot
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
            message.channel.send('Correct.').catch((err) => {
              console.log(err)
            });
          } else if (msgContent[posAfterDomain + 12] != '/') {
            // meme
            isVXMeme = true;
            message.channel.send('Correct.').catch((err) => {
              console.log(err)
            });
          }
        }
      } else {
        if (msgContent.toLowerCase().includes('x.com')) {
          var posAfterDomain = msgContent.toLowerCase().indexOf('x.com') + 1;
          if (msgContent.length < posAfterDomain) {
            // meme
            isVXMeme = true;
            message.channel.send('vxtwitter.com').catch((err) => {
              console.log(err)
            });
          } else if (msgContent[posAfterDomain + 4] != '/') {
            // meme
            isVXMeme = true;
            message.channel.send('vxtwitter.com').catch((err) => {
              console.log(err)
            });
          }
        } else if (msgContent.toLowerCase().includes('twitter.com')) {
          var posAfterDomain = msgContent.toLowerCase().indexOf('twitter.com') + 1;
          if (msgContent.length < posAfterDomain) {
            // meme
            isVXMeme = true;
            message.channel.send('vxtwitter.com').catch((err) => {
              console.log(err)
            });
          } else if (msgContent[posAfterDomain + 10] != '/') {
            // meme
            isVXMeme = true;
            message.channel.send('vxtwitter.com').catch((err) => {
              console.log(err)
            });
          }
        }
      }
  
      // Prepare the modified URLs to grab all of their data to post
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
            message.channel.send('vxtwitter.com').catch((err) => {
              console.log(err)
            });
          else {
            /*
            message.channel.send(capturedURLs[0]).catch((err) => {
              console.log(err)
            });
            */
           
            // Post the fetched data to the Discord channel
            postTweetURLs(capturedURLs, message);
          }
        } else {
          // Post the fetched data to the Discord channel
          postTweetURLs(capturedURLs, message);
        }
      }
    }
  
    // Fix all tiktok.com URLs with vxtiktok.com
    if (msgContent.toLowerCase().includes('tiktok.com')) {
      if (!msgContent.toLowerCase().includes('vxtiktok.com'))
        message.channel.send(msgContent.replaceAll("tiktok.com", "vxtiktok.com")).catch((err) => {
          console.log(err)
        });
    }
  
    // Fix all pixiv.net URLs with phixiv.net
    if (msgContent.toLowerCase().includes('pixiv.net')) {
      if (!msgContent.toLowerCase().includes('phixiv.net'))
        message.channel.send(msgContent.replaceAll("pixiv.net", "phixiv.net")).catch((err) => {
          console.log(err)
        });
    }
  })
  
  async function main() {
    // Init all the Slash commands
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