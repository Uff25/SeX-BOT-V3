const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API = "https://azadx69x.is-a.dev";

module.exports = {
  config: {
    name: "anisearch",
    version: "0.0.7",
    author: "Azadx69x",
    role: 0,
    category: "anime",
    shortDescription: "Fetch anime video",
    cooldown: 5
  },

  onStart: async function ({ message, args, api, event }) {
    let file;

    const react = emoji => {
      try {
        api.setMessageReaction(
          emoji,
          event.messageID,
          () => {},
          true
        );
      } catch {}
    };

    const removeFile = () => {
      if (file && fs.existsSync(file)) {
        fs.unlink(file, () => {});
      }
    };

    try {
      const query =
        args.join(" ").trim() || "random";

      const url =
        `${API}/api/anisearch/` +
        `${encodeURIComponent(query)}`;

      react("🎌");

      const { data } = await axios.get(url, {
        timeout: 30000
      });

      const video =
        data?.data?.data || data?.data;

      if (!video?.video_url) {
        throw new Error(
          video?.message || "No video found"
        );
      }

      file = path.join(
        __dirname,
        `anisearch_${Date.now()}.mp4`
      );

      const response = await axios.get(
        video.video_url,
        {
          responseType: "stream",
          timeout: 60000,
          headers: {
            "User-Agent": "Mozilla/5.0"
          }
        }
      );

      const writer = fs.createWriteStream(file);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
        response.data.on("error", reject);
      });

      const stream = fs.createReadStream(file);

      stream.once("close", removeFile);
      stream.once("error", removeFile);

      await message.reply({
        attachment: stream
      });

      react("✅");
    } catch (error) {
      react("❌");

      await message.reply(
        `❌ ${
          error?.response?.data?.message ||
          error.message ||
          "Failed"
        }`
      );
    } finally {
      const timer = setTimeout(
        removeFile,
        60000
      );

      timer.unref?.();
    }
  }
};
