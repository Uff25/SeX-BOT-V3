const axios = require("axios");

module.exports = {
  config: {
    name: "sing",
    aliases: ["song", "music"],
    version: "0.0.7",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    description: "sing from YouTube",
    category: "social",
    guide: "{pn} <song name>"
  },
  onStart: async function ({ api, args, event }) {
    const q = args.join(" ");
    if (!q) return api.sendMessage("Provide a song name", event.threadID, event.messageID);
    api.setMessageReaction("🔍", event.messageID, () => {}, true);
    try {
      const res = await axios.get(`https://azadx69x.is-a.dev/api/sing?song=${encodeURIComponent(q)}`, { timeout: 30000 });
      const data = res.data?.data;
      if (!data?.success || !data.audio?.url) throw new Error(data?.message || "No audio");
      api.setMessageReaction("⬇️", event.messageID, () => {}, true);
      const audio = await axios.get(data.audio.url, {
        responseType: "stream",
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024,
        maxBodyLength: 50 * 1024 * 1024
      });
      await new Promise((resolve, reject) => {
        api.sendMessage({
          body: `${data.info?.title || q}\n${data.info?.artist || "Unknown artist"}`,
          attachment: audio
        }, event.threadID, (error, info) => error ? reject(error) : resolve(info), event.messageID);
      });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (e) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      const errorMessage = e?.message || e?.errorDescription || e?.errorSummary || e?.error
        || (typeof e === "string" ? e : JSON.stringify(e)) || "Unknown error";
      await api.sendMessage(`Error: ${errorMessage}`, event.threadID, event.messageID);
    }
  }
};
