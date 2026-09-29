const axios = require("axios");

const mahmud = async () => {
	const base = await axios.get(
		"https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
	);
	return base.data.mahmud;
};

module.exports = {
	config: {
		name: "sing",
		version: "2.0",
		author: "MahMUD",
		countDown: 10,
		role: 0,
		shortDescription: {
			en: "Search and download songs"
		},
		longDescription: {
			en: "Search and download any song as MP3"
		},
		category: "music",
		guide: {
			en: "{pn} <song name>"
		}
	},

	langs: {
		en: {
			noInput: "❌ | Please enter a song name.\nExample: sing shape of you",
			success: "✅ | Song found!\n🎵 Song: %1",
			error: "❌ | Error: %1"
		}
	},

	onStart: async function ({ api, event, args, message, getLang }) {
		const query = args.join(" ");

		if (!query)
			return message.reply(getLang("noInput"));

		try {
			api.setMessageReaction("⏳", event.messageID, () => {}, true);

			const baseUrl = await mahmud();

			const apiUrl =
				`${baseUrl}/api/song/mahmud?query=${encodeURIComponent(query)}`;

			const response = await axios({
				method: "GET",
				url: apiUrl,
				responseType: "stream"
			});

			await message.reply({
				body: getLang("success", query),
				attachment: response.data
			});

			api.setMessageReaction("✅", event.messageID, () => {}, true);
		}
		catch (err) {
			console.error("Sing Error:", err);

			api.setMessageReaction("❌", event.messageID, () => {}, true);

			return message.reply(
				getLang("error", err.response?.data?.message || err.message)
			);
		}
	}
};
