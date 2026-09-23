const axios = require("axios");

module.exports = {
  config: {
    name: "imgur",
    version: "0.0.7",
    role: 0,
    author: "Azadx69x",
    countDown: 0,
    category: "upload",
    guide: { en: "[reply to image or video]" }
  },
  onStart: async function ({ api, event }) {
    const att = event.messageReply?.attachments || event.attachments || [];
    if (!att.length) return api.sendMessage("❌ 𝐍𝐨 𝐦𝐞𝐝𝐢𝐚 𝐝𝐞𝐭𝐞𝐜𝐭𝐞𝐝. 𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐧 𝐢𝐦𝐚𝐠𝐞/𝐯𝐢𝐝𝐞𝐨.", event.threadID, event.messageID);
    const url = att[0].url;
    try {
      const res = await axios.get(`https://azadx69x.is-a.dev/api/imgur?url=${encodeURIComponent(url)}`, { timeout: 20000 });
      if (!res.data?.url) throw new Error("Invalid response");
      api.sendMessage(`✅ 𝐔𝐩𝐥𝐨𝐚𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥\n🔗 𝐔𝐑𝐋: ${res.data.url}`, event.threadID, event.messageID);
    } catch (e) {
      console.error("Imgur error:", e);
      api.sendMessage("❌ 𝐄𝐫𝐫𝐨𝐫 𝐮𝐩𝐥𝐨𝐚𝐝𝐢𝐧𝐠 𝐦𝐞𝐝𝐢𝐚. 𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧 𝐥𝐚𝐭𝐞𝐫.", event.threadID, event.messageID);
    }
  }
};
