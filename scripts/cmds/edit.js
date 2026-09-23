const axios = require("axios");

module.exports = {
  config: {
    name: "edit",
    version: "0.0.7",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    shortDescription: "Edit image",
    longDescription: "Reply to any image",
    category: "image",
    guide: "{pn} [text]"
  },
  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) return api.sendMessage("⚠️ Please provide text.", event.threadID);
    const img = event.messageReply?.attachments?.[0]?.url;
    if (!img) return api.sendMessage("🖼️ Please reply to an image.", event.threadID);
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
    try {
      const res = await axios.get(`https://azadx69x.is-a.dev/api/editor?url=${encodeURIComponent(img)}&prompt=${encodeURIComponent(prompt)}`, { responseType: "stream" });
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      api.sendMessage({ body: `✅ Image edited successfully!\n📝 Prompt: ${prompt}`, attachment: res.data }, event.threadID);
    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("❌ Failed to process image.", event.threadID);
    }
  }
};
