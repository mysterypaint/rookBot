class SiteScraper {
	constructor() {}

	/**
	 * Fetches and returns JSON data from the VXTwitter API
	 */
	static async fetchTweetData(twitURL) {
		try {
			twitURL = twitURL.replace(/(https?:\/\/)?(www\.)?((vx)?twitter|x|fixvx).com/i, "https://api.vxtwitter.com");
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

	static async fetchTweetCacheFromURL(inURL) {
		try {
			// Grab tweet data from the URL as a JSON object
			const jString = await this.fetchTweetData(inURL);

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


	static scrapeURLs(inStr, website) {
		let collectedURLs = [];

		let regex = /.+/gm;

		inStr = inStr.replaceAll(' ', '\n');
		inStr = inStr.replaceAll('https://', '');
		inStr = inStr.replaceAll('http://', '');
		regex = /<?(https?:\/\/(www\.)?)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&\/\/=]*>?)/gm;

		try {
			inStr.match(regex).forEach((element) => {
				var isWrapped = element.startsWith('<') && element.endsWith('>');
				var thisURL = element;
				if (isWrapped)
					thisURL = thisURL.substring(1, thisURL.length - 1);
				collectedURLs.push("https://" + thisURL, isWrapped);
			});
		} catch (err) {
			// No URLs were found; Return -1
			return -1;
		}

		return collectedURLs;
	}

	static wrapURL(inStr, regex) {
		if (regex == undefined)
			regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
		return inStr.replace(regex, function(url) {
			return '<' + url.trim() + '>';
		});
	}

	static wrapAllURLs(inStrArray) {
		const regex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z_0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z_0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z_0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z_0-9+&@#\/%=~_|$])/igm;
		var urlCollection = "";

		try {
			for (var i = 0; i < inStrArray.length; i++) {
				var thisURL = inStrArray[i];
				urlCollection += this.wrapURL(thisURL, regex);

				if (i < inStrArray.length - 1)
					urlCollection += " | ";
			}
			return urlCollection;
		} catch (err) {
			console.log("Error wrapping string array: " + inStrArray);
			return 'undefined';
		}
	}
}

// Static properties
SiteScraper.sitesToParse = [];
SiteScraper.collectedTwitSites = [];
SiteScraper.atLeastOneValidURL = {
	value: false,
	get getVal() {
		return this.value;
	},
	set changeVal(newVal) {
		this.value = newVal;
	}
}

// Declare enums
SiteScraper.Websites = {
	Twitter: 0,
	VxTwitter: 1,
	FixVX: 2,
	Pixiv: 3,
	Phixiv: 4,
	Tiktok: 5,
	VxTiktok: 6,
}

export default SiteScraper;