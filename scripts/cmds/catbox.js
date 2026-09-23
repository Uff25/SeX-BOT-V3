const axios = require("axios");

module.exports = {
  config: {
    name: "catbox",
    aliases: ["cb"],
    version: "0.0.4",
    role: 0,
    author: "Azadx69x",
    countDown: 0,
    category: "upload",
    guide: { en: "[reply with media or send a URL]" }
  },
  onStart: async function ({ api, event, args }) {
    let url = args.join(" ");
    if (!url || !/^https?:\/\//i.test(url)) {
      const att = event.messageReply?.attachments || event.attachments || [];
      if (att.length > 0) url = att[0].url;
      else return api.sendMessage("❌ No media detected. Reply to media, attach one, or send a valid URL.", event.threadID, event.messageID);
    }
    try {
      const res = await axios.get(`https://azadx69x.is-a.dev/api/catbox?url=${encodeURIComponent(url)}`, { timeout: 20000 });
      if (!res.data?.url) throw new Error("Invalid response");
      api.sendMessage(`✅ Upload Successful\n🔗 URL: ${res.data.url}`, event.threadID, event.messageID);
    } catch (err) {
      console.error("Catbox error:", err);
      api.sendMessage("❌ Error uploading media. Try again later.", event.threadID, event.messageID);
    }
  }
};
