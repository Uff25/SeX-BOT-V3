const axios = require("axios");

module.exports = {
  config: {
    name: "slap",
    version: "1.0.0",
    author: "Azadx69x",
    countDown: 3,
    role: 0,
    shortDescription: "Slap a user 😆",
    longDescription: "Slap anyone with a funny image",
    category: "fun",
    guide: { en: "{pn} @mention / reply" }
  },
  onStart: async function ({ event, message, usersData }) {
    try {
      const uid = event.senderID;
      const tid = (event.type === "message_reply" && event.messageReply?.senderID) || (event.mentions && Object.keys(event.mentions)[0]);
      if (!tid) return message.reply("❌ Mention or reply to someone!");
      const n1 = await usersData.getName(uid).catch(() => "User");
      const n2 = await usersData.getName(tid).catch(() => "User");
      const a1 = await usersData.getAvatarUrl(uid);
      const a2 = await usersData.getAvatarUrl(tid);
      const stream = await global.utils.getStreamFromURL(`https://azadx69x.is-a.dev/api/slap?avatar1=${encodeURIComponent(a1)}&avatar2=${encodeURIComponent(a2)}`);
      return message.reply({ body: `🤣 ${n1} slapped ${n2}!`, attachment: stream });
    } catch (e) {
      console.error(e);
      return message.reply("❌ Could not fetch slap image.");
    }
  }
};
