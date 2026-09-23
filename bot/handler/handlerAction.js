const createFuncMessage = global.utils.message;
const handlerCheckDB = require("./handlerCheckData.js");

module.exports = (api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData) => {
	const handlerEvents = require(process.env.NODE_ENV == 'development' ? "./handlerEvents.dev.js" : "./handlerEvent.js")(api, threadModel, userModel, dashBoardModel, globalModel, usersData, threadsData, dashBoardData, globalData);

	return async function (event) {
		if (
			global.GoatBot.config.antiInbox == true &&
			(event.senderID == event.threadID || event.userID == event.senderID || event.isGroup == false) &&
			(event.senderID || event.userID || event.isGroup == false)
		)
			return;

		const message = createFuncMessage(api, event);

		await handlerCheckDB(usersData, threadsData, event);

		const handlerChat = await handlerEvents(event, message);
		if (!handlerChat)
			return;

		if(global.GoatBot.config?.approval){
			const approvedtid = await globalData.get("approved", "data", {});
			if (!approvedtid.approved) {
				approvedtid.approved = [];
				await globalData.set("approved", approvedtid, "data");
			}
			if (!approvedtid.approved.includes(event.threadID)) return;
		}

		const {
			onAnyEvent = () => {}, 
			onFirstChat = () => {}, 
			onStart = () => {}, 
			onChat = () => {},
			onReply = () => {}, 
			onEvent = () => {}, 
			handlerEvent = () => {}, 
			onReaction = () => {},
			typ = () => {}, 
			presence = () => {}, 
			read_receipt = () => {}
		} = handlerChat || {};

		// Call onAnyEvent safely with error handling
		try {
			if (typeof onAnyEvent === 'function') {
				await onAnyEvent();
			}
		} catch (err) {
			global.utils.log.err("HANDLER", `Error in onAnyEvent: ${err.message}`);
		}

		switch (event.type) {
			case "message":
			case "message_reply":
			case "message_unsend":
				onFirstChat();
				onChat();
				onStart();
				onReply();
				break;

			case "event":
				handlerEvent();
				onEvent();
				break;

			case "message_reaction":
				await onReaction();

				const {
					delete: del = [],
					kick = [],
					warn = [],
					adduser = []
				} = global.GoatBot.config?.reactBy || {};
				const vipUsers = (global.GoatBot.config?.vipuser || []).map(String);
				const creators = (global.GoatBot.config?.creator || []).map(String);
				const reactorID = String(event.userID || "");
				const targetID = String(event.senderID || "");
				const canManageReaction = vipUsers.includes(reactorID);
				const botID = String(api.getCurrentUserID());

				if (
					creators.includes(reactorID)
					&& targetID !== botID
					&& event.messageID
					&& event.reaction !== null
					&& event.reaction !== undefined
				) {
					try {
						await api.setMessageReaction(event.reaction, event.messageID, undefined, true);
					}
					catch (err) {
						global.utils.log.err("HANDLER", `Failed to mirror creator reaction: ${err.message || err}`);
					}
				}

				if (del.includes(event.reaction)) {
					if (targetID === botID) {
						if (canManageReaction) {
							api.unsendMessage(event.messageID);
						}
					}
				}

				if (canManageReaction && kick.includes(event.reaction)) {
					api.removeUserFromGroup(targetID, event.threadID, (err) => {
						if (err) console.log(err);
					});
				}

				if (canManageReaction && adduser.includes(event.reaction) && targetID) {
					try {
						await api.addUserToGroup(targetID, event.threadID);
					}
					catch (err) {
						global.utils.log.err("HANDLER", `Failed to add ${targetID} after reaction: ${err.message || err}`);
					}
				}

				if (canManageReaction && warn.includes(event.reaction) && targetID) {
					try {
						const warnList = await threadsData.get(event.threadID, "data.warn", []);
						const warnedUser = warnList.find(item => String(item.uid || item.userID) === targetID);
						const warningCount = warnedUser
							? Array.isArray(warnedUser.list) ? warnedUser.list.length + 1 : Number(warnedUser.list || 0) + 1
							: 1;

						if (warnedUser)
							warnedUser.list = warningCount;
						else
							warnList.push({ userID: targetID, list: warningCount });

						await threadsData.set(event.threadID, warnList, "data.warn");
						const userName = await usersData.getName(targetID).catch(() => targetID);
						const body = `⚠️ ${userName} has been warned ${warningCount} time${warningCount === 1 ? "" : "s"}.`;
						api.sendMessage({
							body,
							mentions: [{ tag: userName, id: targetID }]
						}, event.threadID);

						if (warningCount >= 3)
							api.removeUserFromGroup(targetID, event.threadID);
					}
					catch (err) {
						global.utils.log.err("HANDLER", `Failed to warn ${targetID} after reaction: ${err.message || err}`);
					}
				}
				break;

			case "typ":
				typ();
				break;

			case "presence":
				presence();
				break;

			case "read_receipt":
				read_receipt();
				break;

			default:
				break;
		}
	};
};
