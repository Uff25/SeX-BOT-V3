const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "1.7",
		author: "Azadx69x",
		countDown: 5,
		role: 0,
		description: "Prefix manager",
		category: "system"
	},
	langs: {
		en: {
			askPrefix: `😏 Hey %name%, did you ask for my prefix?
╭‣🌐 Global [ %global% ]
╰‣💬 Chat [ %chat% ]
🤖 I'm X69X BOT V3
🫦 𝗍𝗒𝗉𝖾 "%chat%𝗁𝖾𝗅𝗉" 𝗍𝗈 𝗌𝖾𝖾 𝖺𝗅𝗅 𝖺𝗏𝖺𝗂𝗅𝖺𝖻𝗅𝖾 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌.`,
			resetPrefix: "✅ Prefix Reset Successfully\n🌐 Global  [ %global% ]\n💬 Chat [ %chat% ]",
			confirmChange: "♻️ %type% Change\n%old%   [ %new% ]\nReact ✅ to confirm",
			updatedGlobal: "✅ Prefix Update globally. [ %prefix% ]",
			updatedChat: "✅ Prefix Update your group. [ %prefix% ]",
			noPermission: "⛔ You don't have permission!",
			ownerOnly: "⛔ Developers only!",
			cancelled: "❌ Cancelled"
		}
	},
	onStart: async function ({ api, event, args, threadsData, getLang }) {
		const { threadID, messageID, senderID } = event;
		const cfg = global.GoatBot.config;
		const globalPf = cfg.prefix;
		const threadPf = await threadsData.get(threadID, "data.prefix").catch(() => null);
		const currentPf = threadPf || globalPf;
		let name = "User";
		try { name = (await api.getUserInfo(senderID))[senderID]?.name?.split(" ")[0] || "User"; } catch {}
		if (!args[0]) {
			const prefixInfo = getLang("askPrefix")
				.replace(/%name%/g, name)
				.replace(/%global%/g, globalPf)
				.replace(/%chat%/g, currentPf);
			return api.sendMessage(prefixInfo, threadID, messageID);
		}
		const isDev = (cfg.developer || []).map(String).includes(String(senderID));
		const isBotAdmin = (cfg.adminBot || []).map(String).includes(String(senderID));
		const isBotStaff = isDev || isBotAdmin;
		let isGroupAdmin = false;
		try {
			const threadInfo = await api.getThreadInfo(threadID);
			isGroupAdmin = (threadInfo.adminIDs || []).some(a => String(a.id) === String(senderID));
		} catch {}
		if (args[0].toLowerCase() === "reset") {
			if (!isBotStaff && !isGroupAdmin) {
				return api.sendMessage(getLang("noPermission"), threadID, messageID);
			}
			await threadsData.set(threadID, null, "data.prefix");
			return api.sendMessage(
				getLang("resetPrefix")
					.replace(/%global%/g, globalPf)
					.replace(/%chat%/g, globalPf),
				threadID,
				messageID
			);
		}
		const nextPf = args[0];
		const isGlobal = args[1] === "-g";
		if (isGlobal) {
			if (!isDev) return api.sendMessage(getLang("ownerOnly"), threadID, messageID);
		} else {
			if (!isBotStaff && !isGroupAdmin) {
				return api.sendMessage(getLang("noPermission"), threadID, messageID);
			}
		}
		const confirmText = getLang("confirmChange")
			.replace("%type%", isGlobal ? "Global" : "Chat")
			.replace("%old%", isGlobal ? globalPf : currentPf)
			.replace("%new%", nextPf);
		api.sendMessage(confirmText, threadID, (err, info) => {
			if (err) return;
			global.GoatBot.onReaction.set(info.messageID, {
				messageID: info.messageID,
				commandName: "prefix",
				uid: senderID,
				prefix: nextPf,
				isGlobal,
				threadID
			});
		}, messageID);
	},
	onReaction: async function ({ api, event, Reaction, threadsData, getLang }) {
		if (!Reaction || Reaction.uid !== event.userID) return;
		const isConfirm = ["✅", "✓", "☑", "✔"].includes(event.reaction?.replace(/\uFE0F/g, ''));
		if (!isConfirm) {
			global.GoatBot.onReaction.delete(event.messageID);
			return api.sendMessage(getLang("cancelled"), Reaction.threadID, event.messageID);
		}
		const { prefix, isGlobal } = Reaction;
		global.GoatBot.onReaction.delete(event.messageID);
		if (isGlobal) {
			global.GoatBot.config.prefix = prefix;
			await fs.writeFile(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return api.sendMessage(getLang("updatedGlobal").replace("%prefix%", prefix), event.threadID);
		}
		await threadsData.set(event.threadID, prefix, "data.prefix");
		api.sendMessage(getLang("updatedChat").replace("%prefix%", prefix), event.threadID);
	},
	onChat: async function ({ api, event, threadsData, getLang }) {
		if (!event.body) return;
		const body = event.body.trim().toLowerCase();
		if (body !== "prefix") return;
		const cfg = global.GoatBot.config;
		const senderID = event.senderID;
		const isBotStaff = (cfg.adminBot || []).map(String).includes(String(senderID))
						|| (cfg.developer || []).map(String).includes(String(senderID));
		if (isBotStaff) return;
		const { threadID, messageID } = event;
		const globalPf = cfg.prefix;
		const threadPf = await threadsData.get(threadID, "data.prefix").catch(() => null);
		const currentPf = threadPf || globalPf;
		let name = "User";
		try { name = (await api.getUserInfo(senderID))[senderID]?.name?.split(" ")[0] || "User"; } catch {}
		const prefixInfo = getLang("askPrefix")
			.replace(/%name%/g, name)
			.replace(/%global%/g, globalPf)
			.replace(/%chat%/g, currentPf);
		return api.sendMessage(prefixInfo, threadID, messageID);
	}
};
