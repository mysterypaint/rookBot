class Utility {
	constructor() {}
	/**
	 * Returns a random integer between min (inclusive) and max (inclusive).
	 * The value is no lower than min (or the next integer greater than min
	 * if min isn't an integer) and no greater than max (or the next integer
	 * lower than max if max isn't an integer).
	 * Using Math.round() will give you a non-uniform distribution!
	 */
	static getRandomInt(min, max) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	/**
	 * Checks if the string is a valid numerical value (e.g. "5247" = true, "d5832" = false)
	 */
	static strIsNumeric(str) {
		if (typeof str != "string")
			return false;
		return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
			!isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
	}

	/**
	 * Calculates probability of the input value (e.g. 0.2 = 2% chance)
	 * Returns true if it succeeded; false if it fails
	 */
	static probability(n) {
		return !!n && Math.random() <= n;
	};

	/**
	 * Checks if the input string is a valid URL or not
	 */
	static isValidHttpUrl(string) {
		let url;

		try {
			url = new URL(string);
		} catch (_) {
			return false;
		}

		return url.protocol === "http:" || url.protocol === "https:";
	}

}

export default Utility;