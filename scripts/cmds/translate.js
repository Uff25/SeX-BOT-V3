const axios = require("axios");
const API = "https://azadx69x.is-a.dev/api/translate";

async function translate(content, lang, message) {
    try {
        const res = await axios.get(`${API}?text=${encodeURIComponent(content)}&to=${encodeURIComponent(lang)}`);
        const translated = res.data?.data?.translated || res.data?.translated;
        if (!translated) throw new Error("Translation failed");
        await message.reply(`📝 Original:\n   ${content}\n🌐 Translated (${lang}):\n   ${translated}`);
    } catch {
        await message.reply("❌ Error: Translation failed!");
    }
}

module.exports = {
    config: {
        name: "translate",
        aliases: ["trans"],
        version: "0.0.1",
        role: 0,
        author: "Azadx69x",
        category: "utility",
        cooldowns: 3
    },
    onStart: async function ({ message, event, args, threadsData, getLang, commandName }) {
        const input = args.join(" ").trim();
        let content, lang;
        const threadLang = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;

        if (args[0] && ["-r", "-react", "-reaction"].includes(args[0])) {
            if (args[1] == "set") {
                return message.reply("React with emoji to set", (err, info) =>
                    global.GoatBot.onReaction.set(info.messageID, {
                        type: "setEmoji",
                        commandName,
                        messageID: info.messageID,
                        authorID: event.senderID
                    })
                );
            }
            const isEnable = args[1] == "on" ? true : args[1] == "off" ? false : null;
            if (isEnable == null) return message.reply("Invalid argument!");
            await threadsData.set(event.threadID, isEnable, "data.translate.autoTranslateWhenReaction");
            return message.reply(isEnable ? "Reaction translate ON" : "Reaction translate OFF");
        }

        if (event.messageReply) {
            content = event.messageReply.body || "";
            lang = getTargetLanguage(input) || threadLang;
        } else {
            const parsed = splitTargetLanguage(input);
            content = parsed.text;
            lang = parsed.lang || threadLang;
        }

        if (!content) return message.SyntaxError();
        return translate(content, String(lang).trim().toLowerCase(), message);
    },
    onChat: async ({ event, threadsData }) => {
        if (!await threadsData.get(event.threadID, "data.translate.autoTranslateWhenReaction")) return;
        global.GoatBot.onReaction.set(event.messageID, {
            commandName: 'translate',
            messageID: event.messageID,
            body: event.body,
            type: "translate"
        });
    },
    onReaction: async ({ message, Reaction, event, threadsData, getLang }) => {
        if (Reaction.type == "setEmoji") {
            if (event.userID != Reaction.authorID) return;
            const emoji = event.reaction;
            if (!emoji) return;
            await threadsData.set(event.threadID, emoji, "data.translate.emojiTranslate");
            return message.reply(`Emoji set to ${emoji}`, () => message.unsend(Reaction.messageID));
        }
        if (Reaction.type == "translate") {
            const emojiTrans = await threadsData.get(event.threadID, "data.translate.emojiTranslate") || "🌐";
            if (event.reaction == emojiTrans) {
                const lang = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language;
                return translate(Reaction.body, String(lang).trim().toLowerCase(), message);
            }
        }
    }
};

function getTargetLanguage(input) {
    return input.match(/(?:->|=>)\s*([a-z]{2,3})$/i)?.[1] || input.match(/^([a-z]{2,3})$/i)?.[1];
}

function splitTargetLanguage(input) {
    const match = input.match(/^(.*?)\s*(?:->|=>)\s*([a-z]{2,3})$/i);
    if (!match) return { text: input, lang: null };
    return { text: match[1].trim(), lang: match[2] };
}
