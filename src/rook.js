import Utility from './utility.js';
import SiteScraper from './siteScraper.js';
import {
	EmbedBuilder,
} from 'discord.js';

// Declare constants
const mifuChance = 0.001; // 0.2% chance of triggering mifushrimp
const okeiChance = 0.0001; // 0.1% chance of triggering okei
const yuptuneChance = 0.00001; // Approx ~1/700 (0.014) chance of triggering yuptune

class Rook {
	constructor(process) {
		this._castIeID = process.env.CASTIE_ID;
		this._ark_whitelisted_moderator_ids = process.env.ARK_WHITELISTED_MODERATOR_IDS.split(", ");
		
		this._ark_guild_id = process.env.ARK_GUILD_ID;
		this._ark_channel_id_bots = process.env.ARK_CHANNEL_ID_BOTS;
		this._ark_channel_id_da_chat = process.env.ARK_CHANNEL_ID_DA_CHAT;
		this._ark_channel_id_hotchip = process.env.ARK_CHANNEL_ID_HOTCHIP;
		this._ark_channel_id_room3 = process.env.ARK_CHANNEL_ID_ROOM3;
		this._ark_whitelisted_channel_ids = process.env.ARK_WHITELISTED_CHANNEL_IDS.split(", ");
		this._personal_guild_id = process.env.PERSONAL_GUILD_ID;
		this._personal_channel_id_n = process.env.PERSONAL_CHANNEL_ID_N;
		this._mashiro_pray_emote_id = process.env.MASHIRO_PRAY_EMOTE_ID;
		this._mifu_shrimp_emote_id = process.env.MIFU_SHRIMP_EMOTE_ID;
		this._okei_emote_id = process.env.OKEI_EMOTE_ID;

		// Declare vars
		this._ayylmaoCooldownTimer = 0;
		this._maybenotCooldownTimer = 0;
		this._sayoriCooldownTimer = 0;
		this._numTwitSites = 0;
		this._numVxTwitSites = 0;
		this._numFixVxTwitSites = 0;
		this._numPixivSites = 0;
		this._numPhixivSites = 0;
		this._numTiktokSites = 0;
		this._numVxTiktokSites = 0;

		// Declare and init arrays
		this._tweetMediaCache = [];
		this._tweetUsernameCache = [];
		this._tweetOriginURLCache = [];
		this._pixivMediaCache = [];
		this._tiktokURLCache = [];
	}

	resetSiteCount() {
		this._numTwitSites = 0;
		this._numVxTwitSites = 0;
		this._numFixVxTwitSites = 0;
		this._numPixivSites = 0;
		this._numPhixivSites = 0;
		this._numTiktokSites = 0;
		this._numVxTiktokSites = 0;
	}

	resetSiteCache() {
		this._tweetMediaCache = [];
		this._tweetUsernameCache = [];
		this._tweetOriginURLCache = [];
		this._pixivMediaCache = [];
		this._tiktokURLCache = [];
	}

	/**
	 * Removes all URLs from the input string and returns the modified string
	 */
	eatAllURLs(inStr) {
		let reg = /<:*.+:\d+>/gm;
		return inStr.replace(reg, '').trim();
	}

	/**
	 * Removes all Discord-formatted emotes from the input string and returns the modified string
	 */
	eatAllEmotes(inStr) {
		let reg = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*)/gm;
		return inStr.replace(reg, '').trim();
	}

	/**
	 * Removes all Discord-formatted pings from the input string and returns the modified string
	 */
	eatAllPings(inStr) {
		let reg = /<@(\&)?\d+>/gm;
		return inStr.replace(reg, '').trim();
	}

	/**
	 * Pre-formats a Discord attachment for quick prepartion to generate posts with attachments
	 */
	attachFile(fPath, name, description) {
		return [{
			attachment: fPath,
			name: name,
			description: description,
		}];
	}

	/**
	 * Posts a message on Discord with an attachment uploaded from the bot's local resources
	 */
	sendLocalFile(channel, fPath, name, description) {
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
	sayMifuShrimp(channel) {
		try {
			channel.send('<:mifushrimp:' + this._mifu_shrimp_emote_id + '>').catch(err => {console.log(err)});;
		} catch (error) {
			console.log(error);
		}
	}

	/**
	 * Sends the :okei: emote to the input Discord channel
	 */
	sayOkei(channel) {
		try {
			channel.send('<:okei:' + this._okei_emote_id + '>').catch(err => {console.log(err)});;
		} catch (error) {
			console.log(error);
		}
	}

	/**
	 * Sends a cute message to the input Discord channel
	 */
	sayCute(message) {
		const msgContent = message.content;
		if (msgContent.toLowerCase().includes('cute')) {
			try {
				message.reply({
					content: 'cute... <:mashiropray:' + this._mashiro_pray_emote_id + '>'
				}).catch(err => {console.log(err)});
			} catch (error) {
				console.log(error);
			}
		}
	}

	/**
	 * Posts all fetched media URLs from Tiktok to Discord
	 */
	async postTiktokURLs(message, inCache) {
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
	async postTweetURLs(message, gatheredPostData) {
		var msgContent = "";

		const allMediaURLs = await gatheredPostData[0][0];
		const allUsernames = await gatheredPostData[0][1];
		const allOriginURLs = await gatheredPostData[0][2];

		if (allUsernames == "[[ERROR]]") {
			var errCode = allOriginURLs;
			var errURL = allMediaURLs;

			errURL = errURL.replace("api.vxtwitter", "vxtwitter");
			
			msgContent = "VXTwitter API failed! (Err Code: " + errCode + ").\nAttempting to post it myself: " + errURL;
			await message.channel.send({
				content: msgContent,
			}).catch((err) => {
				switch (err.code) {
					default:
						break;
				}
			});
		} else {
			// Claim who posted the message if we're also posting Pixiv or Tiktok URLs, because the user's message is about to get deleted
			if (this._numTiktokSites > 0 || this._numPixivSites > 0 || this._numVxTiktokSites > 0 || this._numPhixivSites > 0) {
				msgContent = message.member.user.tag + " posted: " + SiteScraper.wrapAllURLs(allOriginURLs);
			}

			try {
				if (allMediaURLs.length <= 0) {
					let vxOriginURLs = [];
					for (var url of allOriginURLs)
						vxOriginURLs.push(url.replace('twitter.com', 'vxtwitter.com'));

					msgContent = "";
					for (var i = 0; i < vxOriginURLs.length; i++) {
						msgContent += vxOriginURLs[i];
						if (i < vxOriginURLs.length - 1)
							msgContent += " | ";
					}
					await message.channel.send({
						content: msgContent,
					}).catch((err) => {console.log(err);});
				} else {
					await message.channel.send({
						content: msgContent,
						files: await allMediaURLs,
					}).catch((err) => {
						switch (err.code) {
							case 50035:
								msgContent = "**Too many images to combine! Only posting the first 10. (Max: 10)**\n\n" + msgContent;
								var firstTenAttachments = [];
								for (var i = 0; i < 10; i++)
									firstTenAttachments.push(allMediaURLs[i]);
								message.channel.send({
									content: msgContent,
									files: firstTenAttachments,
								});
								break;
						}
					});
				}
			} catch (error) {
				message.channel.send("Could not resolve to host :sob: :broken_heart:").catch((err) => {
					console.log(err)
				});
			}
		}
	}


	/**
	 * Posts all fetched media URLs from Pixiv to Discord
	 */
	async postPixivURLs(message, gatheredPostData) {
		// If we are not about to post Tiktoks, delete this message (otherwise, let the Tiktok post code do it for us: We don't want to accidentally delete two messages!)
		if (this._numTiktokSites <= 0 && this._numVxTiktokSites <= 0)
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
			var thisAuthorLang = await thisArtURL.match(/pixiv\.net\/\w\w\/a/gm)[0].substring(10, 12);
			var thisAuthorURL = await "https://www.pixiv.net/" + thisAuthorLang + "/users/" + thisAuthorID;

			var outputMedia = [];

			for (const url of await thisMediaURLCollection) {
				outputMedia.push(url);
			}

			// Claim who posted the message
			var msgContent = await "Artist: [**" + thisPixAuthorName + "**](" + SiteScraper.wrapURL(thisAuthorURL) + ")" + "   |   Shared by: " + message.member.user.tag + "   |   " + SiteScraper.wrapURL(thisArtURL);
			try {
				await message.channel.send({
					content: msgContent,
					files: await outputMedia,
				}).catch((err) => {
					switch (err.code) {
						case 50035:
							msgContent = "**Too many images to combine! Only posting the first 10. (Max: 10)**\n\n" + msgContent;
							var firstTenAttachments = [];
							for (var i = 0; i < 10; i++)
								firstTenAttachments.push(outputMedia[i]);
							message.channel.send({
								content: msgContent,
								files: firstTenAttachments,
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
	 * Fetches and returns JSON data from the Phixiv API
	 */
	async fetchPixivData(inURL) {

		try {
			let regex = await/p[h]?ixiv\.net\/(\w\w\/)?artworks\/(\d+)/ig;
			let regMatches = await regex.exec(inURL); //inURL.matchAll(regex);
			let artID = await regMatches[2];
			let i = 1;
			if (await artID == undefined)
				while (artID == undefined) {
					artID = await regMatches[i];
					i++;

					if (i > 100)
						break;
				}
				
			let pixivURL = await `https://phixiv.net/api/info?id=` + artID;
			if (i > 100) {
				console.log(`Invalid URL: ` + pixivURL);
				return -3;
			}

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

	async fetchPixivCacheFromURL(inURL) {
		try {
			// Grab tweet data from the URL as a JSON object
			var jsonData = await this.fetchPixivData(inURL);

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



	/**
	 * Detects and caches all URLs to SiteScraper.sitesToParse[]
	 */
	identifyURLs(inURL, regex, sitesToParse, websiteType) {
		var detectedSites = inURL.match(regex);

		if (detectedSites != null) {
			SiteScraper.sitesToParse.push(detectedSites[0], websiteType);

			switch (websiteType) {
				case SiteScraper.Websites.Twitter:
					SiteScraper.collectedTwitSites.push(detectedSites[0]);
					SiteScraper.atLeastOneValidURL.changeVal = true;
					this._numTwitSites++;
					break;
				case SiteScraper.Websites.VxTwitter:
					SiteScraper.collectedTwitSites.push(detectedSites[0]);
					SiteScraper.atLeastOneValidURL.changeVal = true;
					this._numVxTwitSites++;
					break;
				case SiteScraper.Websites.FixVX:
					SiteScraper.collectedTwitSites.push(detectedSites[0]);
					SiteScraper.atLeastOneValidURL.changeVal = true;
					this._numFixVxTwitSites++;
					break;
				case SiteScraper.Websites.Pixiv:
					SiteScraper.atLeastOneValidURL.changeVal = true;
					this._numPixivSites++;
					break;
				case SiteScraper.Websites.Phixiv:
					SiteScraper.atLeastOneValidURL.changeVal = true;
					this._numPhixivSites++;
					break;
				case SiteScraper.Websites.Tiktok:
					SiteScraper.atLeastOneValidURL.changeVal = true;
					this._numTiktokSites++;
					break;
				case SiteScraper.Websites.VxTiktok:
					SiteScraper.atLeastOneValidURL.changeVal = true;
					this._numVxTiktokSites++;
					break;
			}
		}
	}

	async parseAllSites(sitesToParse, numTwitSites, numVxTwitSites, numFixVxTwitSites, numPixivSites, numPhixivSites) {
		this._tweetMediaCache = [];
		this._tweetUsernameCache = [];
		this._tweetOriginURLCache = [];
		this._pixivMediaCache = [];
		this._tiktokURLCache = [];

		for (var i = 0; i < SiteScraper.sitesToParse.length; i += 2) {
			var thisURL = SiteScraper.sitesToParse[i];
			var websiteType = SiteScraper.sitesToParse[i + 1];

			switch (websiteType) {
				case SiteScraper.Websites.Twitter:
				case SiteScraper.Websites.VxTwitter:
					// Only handle Twitter URLs if there is at least one non-VX Tweet that was scraped, or if this is a URL batch
					if (this._numTwitSites > 0 || (this.numVxTwitSites > 0 && (this._numPixivSites > 0 || this._numTiktokSites > 0))) {
						thisURL = thisURL.replaceAll('fixvx', 'x');
						thisURL = thisURL.replaceAll('vxtwitter', 'x');
						thisURL = thisURL.replaceAll('twitter', 'x');
						thisURL = thisURL.replaceAll('x', 'vxtwitter');
						
						// Promise a tweet cache, and then store the tweet's media in our this.tweetMediaCache[]
						const res = await SiteScraper.fetchTweetCacheFromURL(thisURL);

						if (res < 0) {
							console.log("Invalid tweet detected: " + thisURL);
							this._tweetMediaCache.push(thisURL);
							this._tweetUsernameCache.push("[[ERROR]]");
							this._tweetOriginURLCache.push(res);
						}
						else {
							for (const mediaURL of res[0])
								this._tweetMediaCache.push(mediaURL);

							this._tweetUsernameCache.push(res[1]); // tweet username
							this._tweetOriginURLCache.push(res[2]); // tweet origin URL
						}
					}
					break;
				case SiteScraper.Websites.Pixiv:
				case SiteScraper.Websites.Phixiv:
					// Only handle Pixiv URLs if there is at least one non-Phixiv Tweet that was scraped, or if this is a URL batch
					if (this._numPixivSites > 0 || (this._numPhixivSites > 0 && (this._numTwitSites > 0 || this._numTiktokSites > 0))) {
						thisURL = thisURL.replaceAll('phixiv', 'pixiv');

						// Promise a pixiv metadata cache, and then store the data to our this.pixivMediaCache[]
						const foundMediaMetadata = await this.fetchPixivCacheFromURL(thisURL);
						this._pixivMediaCache.push(foundMediaMetadata);
					}
					break;
				case SiteScraper.Websites.Tiktok:
					thisURL = thisURL.replaceAll('tiktok', 'vxtiktok');
					this._tiktokURLCache.push(thisURL);
					break;
				case SiteScraper.Websites.VxTiktok:
					this._tiktokURLCache.push(thisURL);
					break;
			}
		}

		return [
			[await this._tweetMediaCache, await this._tweetUsernameCache, await this._tweetOriginURLCache], await this._pixivMediaCache, await this._tiktokURLCache
		];
	}

	async interactionCreateEvent(interaction) {
		// Handle Slash commands
		if (interaction.isChatInputCommand()) {
			switch (interaction.commandName) {
				case 'sayori':
					interaction.reply({
						files: Utility.attachFile('src/img/memes/sayori.png', 'sayori.png', 'Sayori')
					})
					break;
				case 'yuptune':
					interaction.reply({
						files: Utility.attachFile('src/img/memes/Yuptune.gif', 'Yuptune.gif', 'Yuptune')
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

							if (Utility.strIsNumeric(numDice) && Utility.strIsNumeric(numSides)) {
								numDice = parseFloat(numDice);
								numSides = parseFloat(numSides);

								if (numDice > 0 && numSides > 0) {
									if (numDice > 15) {
										interaction.reply("That's too many dice! (Max: 15)");
										break;
									}

									diceSides = [];

									for (let i = 0; i < numDice; i++) {
										let thisSideValue = Utility.getRandomInt(1, numSides);
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
				case 'del':
					/// Handle messages *specifically* sent by Ark mods
					if (interaction.guild.id == this._ark_guild_id || interaction.guild.id == this._personal_guild_id) {
						if (this._ark_whitelisted_moderator_ids.includes(interaction.user.id)) {
							let numMsgs = interaction.options.get('count').value;
							let userID;
							try {
								userID = interaction.options.get('user').value;
							} catch(err) {
								userID = undefined;
							}

							interaction.reply("Working...").then(msg => {
								setTimeout(() => msg.delete(), 10)
							})
							.catch(err => {console.log("Could not delete messages: " + err)});
							
							// Iterate through the [numChannelMsg] most recent messages sent in the channel from everyone
							const fetchedChannel = interaction.guild.channels.cache.get(interaction.channel.id);

							/// TODO: More reliable deleting to account for potential lag 
							fetchedChannel.messages.fetch({limit: numMsgs}).then((collected) => {
								collected.forEach(msg => {
									if (userID != undefined) {
										if (msg.author.id == userID)
											msg.delete(); // We specified a user: Ensure that the bot ONLY deletes that user's messages
									} else
										msg.delete(); // Delete every message, regardless who it was from
								})
							})
						} else {
							interaction.reply("Forbidden.");
						}
					} else {
						interaction.reply("Forbidden.");
					}
					break;
			}
		}
	}

	async messageCreateEvent(message) {
		console.log(message);

		if (message.author.bot)
			return;

		// Log the message to the console
		//console.log(message.createdAt.toDateString(), `${message.author.tag}:`, `"${message.content}"`);

		var msgContent = message.content;
		let regex;

		// Small chance to post :mifushrimp: emote to a channel; Send it to the channel that triggered the successful probability
		if (Utility.probability(mifuChance)) {
			if (this._ark_whitelisted_channel_ids.includes(message.channel.id)) {
				let targChannel = message.channel; //.channels.cache.get(randomWhitelistedChannel);

				this.sayMifuShrimp(targChannel);
			}
		}

		// Same as above, but for :okei:
		if (Utility.probability(okeiChance)) {
			if (this._ark_whitelisted_channel_ids.includes(message.channel.id)) {
				let targChannel = message.channel; //.channels.cache.get(randomWhitelistedChannel);
				this.sayOkei(targChannel);
			}
		}

		// Same as above, but for Yuptune.gif. Posts it *specifically* in the #room3 channel
		if (Utility.probability(yuptuneChance)) {
			let targChannel = message.client.channels.cache.get(this. this._ark_channel_id_room3);
			Utility.sendLocalFile(targChannel, 'src/img/memes/Yuptune.gif', 'Yuptune.gif', 'Yuptune');
		}

		// Replies "nice" to anyone who says "69". Excludes edgecase, like when 69 is present in URLs, Emotes, Pings, or Embeds
		if (msgContent.includes('69')) {
			if (message.embeds.length > 0) {
				var embed = message.embeds[0];
				if (!embed.image) {
					var tmpMsg = new String(message);

					tmpMsg = this.eatAllURLs(tmpMsg);
					tmpMsg = this.eatAllEmotes(tmpMsg);
					tmpMsg = this.eatAllPings(tmpMsg);

					console.log(tmpMsg);
					if (tmpMsg.length > 0 && tmpMsg.includes('69'))
						message.channel.send("Nice").catch((err) => {
							console.log(err)
						});
				}
			} else if (!Utility.isValidHttpUrl(message)) {
				var tmpMsg = new String(message);
				tmpMsg = this.eatAllURLs(tmpMsg);
				tmpMsg = this.eatAllEmotes(tmpMsg);
				tmpMsg = this.eatAllPings(tmpMsg);

				if (tmpMsg.includes('69'))
					message.channel.send("Nice").catch((err) => {
						console.log(err)
					});
			}
		}

		// React to Discord messages that say "castle" or "castIe" (not case-sensitive) with :mashiropray:
		if (msgContent.toLowerCase().includes('castle') || msgContent.includes('castIe')) {
			try {
				message.react('<:mashiropray:' + this._mashiro_pray_emote_id + '>').catch(err => {console.log(err)});
			} catch (error) {
				console.log(error);
			}
		}

		// Replies "ayy lmao" to anyone who says "ayy"
		if (this._ayylmaoCooldownTimer <= 0) {
			if (msgContent.toLowerCase() === 'ayy') {
				message.channel.send("ayy lmao").catch((err) => {
					console.log(err)
				});
				this._ayylmaoCooldownTimer = 1;
			}
		} else
			this._ayylmaoCooldownTimer--;

		// Replies "or maybe not" to anyone who says "maybe"
		if (this._maybenotCooldownTimer <= 0) {
			if (msgContent.toLowerCase() === 'maybe') {
				message.channel.send("or maybe not").catch((err) => {
					console.log(err)
				});
				this._maybenotCooldownTimer = 1;
			}
		} else
			this._maybenotCooldownTimer--;

		// Replies "(( sayori.jpg ))" to anyone who mentions "sayori" anywhere in their message
		if (this._sayoriCooldownTimer <= 0) {
			if (msgContent.toLowerCase().includes('sayori')) {
				message.channel.send({
					files: Utility.attachFile('src/img/memes/hang-in-there-doki-doki-literature-club.png', 'sayori.png', 'Sayori')
				}).catch((err) => {
					console.log(err)
				});
				this._sayoriCooldownTimer = 1;
			}
		} else
			this._sayoriCooldownTimer--;

		/// Handle messages *specifically* sent by user castIe
		if (message.author.id == this._castIeID) {
			let guildID = message.guild.id;
			let channelID = message.channel.id;
			let allowed = (element) => element == channelID;

			// Sleeve meme
			if (msgContent.includes('sleeve')) {
				message.channel.send({
					files: Utility.attachFile('src/vids/memes/bomb.mov', 'bomb.mov', 'bomb.mov')
				}).catch((err) => {
					console.log(err)
				});
			}
		}

		// Populate the cache with scraped URLs from Twitter, Pixiv, and Tiktok
		let scrapedURLs = await SiteScraper.scrapeURLs(msgContent);
		SiteScraper.atLeastOneValidURL.changeVal = false;
		this.resetSiteCount();

		SiteScraper.sitesToParse = [];
		SiteScraper.collectedTwitSites = [];

		if (scrapedURLs != -1) {
			for (var i = 0; i < scrapedURLs.length; i+=2) {
				var thisURL = scrapedURLs[i];
				var isWrapped = scrapedURLs[i + 1];
				
				// Do not do anything with sites that are encapsulated with < and >
				if (isWrapped)
					continue;
				
				// Detect and cache all twitter.com/x.com URLs to SiteScraper.sitesToParse[]
				this.identifyURLs(thisURL, /^(http?s:\/\/)?(twitter|x)\.com\/[a-z_A-Z\d]+\/status\/\d+/gm, SiteScraper.sitesToParse, SiteScraper.Websites.Twitter);

				// Detect and cache all vxtwitter.com URLs to tweetsToParse[]
				this.identifyURLs(thisURL, /^(http?s:\/\/)?(vxtwitter)\.com\/[a-z_A-Z\d]+\/status\/\d+/gm, SiteScraper.sitesToParse, SiteScraper.Websites.VxTwitter);

				// Detect and cache all fixvx.com URLs to tweetsToParse[]
				this.identifyURLs(thisURL, /^(http?s:\/\/)?(fixvx)\.com\/[a-z_A-Z\d]+\/status\/\d+/gm, SiteScraper.sitesToParse, SiteScraper.Websites.FixVX);

				// Detect and cache all pixiv.net art URLs to SiteScraper.sitesToParse[]
				this.identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?pixiv.net\/(\w\w\/)?artworks\/\d.+/gm, SiteScraper.sitesToParse, SiteScraper.Websites.Pixiv);

				// Detect and cache all phixiv.net art URLs to SiteScraper.sitesToParse[]
				this.identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?phixiv.net\/(\w\w\/)?artworks\/\d.+/gm, SiteScraper.sitesToParse, SiteScraper.Websites.Phixiv);

				// Detect and cache all tiktok.com URLs to SiteScraper.sitesToParse[]
				this.identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?tiktok.com\/(t\/[a-zA-Z\d]+|@[a-zA-Z_\d]+\/video\/\d+)/gm, SiteScraper.sitesToParse, SiteScraper.Websites.Tiktok);

				// Detect and cache all tiktok.com URLs to SiteScraper.sitesToParse[]
				this.identifyURLs(thisURL, /^(https?:\/\/)?(www\.)?vxtiktok.com\/(t\/[a-zA-Z\d]+|@[a-zA-Z_\d]+\/video\/\d+)/gm, SiteScraper.sitesToParse, SiteScraper.Websites.VxTiktok);
			}

			// Loop through every single scraped URL and prepare a "To Post" cache for each website

			console.log("scrapedURLs: " + scrapedURLs);

			const gatheredPostData = await this.parseAllSites(SiteScraper.sitesToParse, this._numTwitSites, this._numVxTwitSites, this._numFixVxTwitSites, this._numPixivSites, this._numPhixivSites);

			regex = /((vx)?twitter|^x| x)\.com($| )/gm;
			if (this._numTwitSites > 0 || (this._numVxTwitSites > 0 && (this._numPixivSites > 0 || this._numTiktokSites > 0))) {
				if (message.content.startsWith('vx ')) {
					var outMsg = "";
					for (var twitSite of SiteScraper.collectedTwitSites) {
						var rxTmp = /(vx)?twitter.com/i;
						outMsg += twitSite.replace(rxTmp, 'vxtwitter.com') + "\n";
					}
					message.channel.send({
						content: outMsg
					});
				} else
					this.postTweetURLs(message, await gatheredPostData);
			} else if (message.content.match(regex) && !message.content.includes(`fixvx.com`)) {
				// Handle memes
				if (message.content.includes(`vxtwitter.com`))
					message.channel.send(`Correct.`);
				else
					message.channel.send(`vxtwitter.com`);
			} else if (message.content.includes('fixvx.com') && this._numFixVxTwitSites <= 0)
				message.channel.send(`Correct.`);

			regex = /^p(h)?ixiv.net/gm;
			if (this._numPixivSites > 0 || (this._numPhixivSites > 0 && (this._numTwitSites > 0 || this._numTiktokSites > 0)))
				this.postPixivURLs(message, await gatheredPostData);
			else if (message.content.match(regex)) {
				// Handle memes
				if (message.content.includes(`phixiv.net`))
					message.channel.send(`Correct.`);
				else
					message.channel.send(`phixiv.net`);
			}

			regex = /^(vx)?tiktok.com/gm;
			if (this._numTiktokSites > 0 || (this._numVxTiktokSites > 0 && (this._numTwitSites > 0 || this._numPixivSites > 0)))
				this.postTiktokURLs(message, await gatheredPostData);
			else if (message.content.match(regex)) {
				// Handle memes
				if (message.content.includes(`vxtiktok.com`))
					message.channel.send(`Correct.`);
				else
					message.channel.send(`vxtiktok.com`);
			}
		}
	}
}

export default Rook;