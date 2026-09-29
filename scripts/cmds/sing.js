const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createReadStream } = require("fs");

module.exports = {
  config: {
    name: "sing",
    version: "4.0",
    author: "Siam Ahmed Saan",
    countDown: 5,
    role: 0,
    shortDescription: "Search or download MP3/MP4",
    longDescription: "Search songs and download MP3 or MP4 from YouTube",
    category: "ANIME & MEDIA",
    guide: "{p}sing <song name or YouTube link>\nভিডিওর জন্য রিপ্লাই করার সময় সংখ্যার পাশে v লিখুন (যেমন: 1 v)"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID, messageReply } = event;
    const BASE_URL = "https://vercel.app";

    let query = args.join(" ");

    if (messageReply?.body) {
      const match = messageReply.body.match(/(https?:\/\/[^\s]+)/);
      if (match && match[0].includes("youtu")) {
        return downloadMedia(api, threadID, messageID, match[0], BASE_URL, "audio");
      }
    }

    if (query && query.includes("youtu")) {
      return downloadMedia(api, threadID, messageID, query, BASE_URL, "audio");
    }

    if (!query) {
      return api.sendMessage("❌ অনুগ্রহ করে গানের নাম অথবা ইউটিউব লিংক দিন।", threadID, messageID);
    }

    try {
      const { data } = await axios.get(`${BASE_URL}/ytsearch?q=${encodeURIComponent(query)}`);
      const results = data.results?.slice(0, 5);

      if (!results || results.length === 0) {
        return api.sendMessage("❌ কোনো গান খুঁজে পাওয়া যায়নি।", threadID, messageID);
      }

      let msg = "🎵 𝗠𝗨𝗦𝗜𝗖 & 𝗩𝗜𝗗𝗘𝗢 𝗦𝗘𝗔𝗥𝗖𝗛\n━━━━━━━━━━━━━━━\n";
      const attachments = [];
      const tempFiles = [];

      for (let i = 0; i < results.length; i++) {
        const video = results[i];
        msg += `${i + 1}. ${video.title}\n⏱️ ${video.duration || "N/A"}\n📺 ${video.channel || "Unknown"}\n\n`;

        if (video.thumbnail) {
          try {
            const thumbResponse = await axios({
              url: video.thumbnail,
              method: "GET",
              responseType: "arraybuffer"
            });

            const tempThumbPath = path.join(__dirname, `temp_thumb_${Date.now()}_${i}.jpg`);
            fs.writeFileSync(tempThumbPath, thumbResponse.data);
            tempFiles.push(tempThumbPath);
            attachments.push(createReadStream(tempThumbPath));
          } catch (err) {
            console.error(`Failed to download thumbnail ${i}:`, err.message);
          }
        }
      }

      msg += "━━━━━━━━━━━━━━━\n📥 ডাউনলোড করতে ১-৫ রিপ্লাই দিন।\n🎬 ভিডিওর জন্য সংখ্যার পাশে 'v' লিখুন (যেমন: 1 v)";

      const messageData = { body: msg };
      if (attachments.length > 0) {
        messageData.attachment = attachments;
      }

      return api.sendMessage(
        messageData,
        threadID,
        (err, info) => {
          tempFiles.forEach(file => {
            try {
              if (fs.existsSync(file)) fs.unlinkSync(file);
            } catch (cleanupErr) {
              console.error("Failed to delete temp thumbnail:", cleanupErr.message);
            }
          });

          if (err) return;

          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            messageID: info.messageID,
            author: senderID,
            results,
            baseUrl: BASE_URL
          });
        },
        messageID
      );

    } catch (err) {
      console.error(err);
      return api.sendMessage("⚠️ অনুসন্ধান ব্যর্থ হয়েছে।", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, body, senderID } = event;

    if (senderID !== Reply.author) return;

    const input = body.trim().toLowerCase();
    const match = input.match(/^([1-5])(?:\s*(v|video))?\$/);

    if (!match) {
      return api.sendMessage("❌ ভুল ফরম্যাট। অনুগ্রহ করে ১-৫ এর মধ্যে সংখ্যা অথবা ভিডিওর জন্য '1 v' এভাবে লিখুন।", threadID, messageID);
    }

    const index = parseInt(match[1]) - 1;
    const type = match[2] ? "video" : "audio";

    const selected = Reply.results[index];

    try {
      await api.unsendMessage(Reply.messageID, threadID);
    } catch (err) {
      console.error("Failed to unsend message:", err.message);
    }

    return downloadMedia(api, threadID, messageID, selected.url, Reply.baseUrl, type, selected.duration);
  }
};

async function downloadMedia(api, threadID, messageID, url, baseUrl, type = "audio", duration = "N/A") {
  let waitMsg;
  let tempFilePath = null;
  const isVideo = type === "video";
  const endpoint = isVideo ? "ytmp4" : "ytmp3";
  const ext = isVideo ? "mp4" : "mp3";

  try {
    waitMsg = await api.sendMessage(`⏳ ${isVideo ? "ভিডিও" : "অডিও"} প্রসেস করা হচ্ছে, দয়া করে অপেক্ষা করুন...`, threadID);

    const { data } = await axios.get(`${baseUrl}/${endpoint}?url=${encodeURIComponent(url)}`);

    if (!data.success || !data.url) {
      if (waitMsg?.messageID) {
        try { await api.unsendMessage(waitMsg.messageID, threadID); } catch {}
      }
      return api.sendMessage(`❌ ${isVideo ? "ভিডিও" : "অডিও"} ডাউনলোড করতে ব্যর্থ হয়েছে।`, threadID, messageID);
    }

    const response = await axios({
      url: data.url,
      method: "GET",
      responseType: "arraybuffer"
    });

    tempFilePath = path.join(__dirname, `temp_${Date.now()}.${ext}`);
    fs.writeFileSync(tempFilePath, response.data);

    if (waitMsg?.messageID) {
      try { await api.unsendMessage(waitMsg.messageID, threadID); } catch {}
    }

    return api.sendMessage(
      {
        body: `🎬 ${data.title || "Unknown"}\n👤 ${data.author || "Unknown"}\n⏱️ ${duration}\n📦 টাইপ: ${isVideo ? "ভিডিও (MP4)" : "অডিও (MP3)"}`,
        attachment: createReadStream(tempFilePath)
      },
      threadID,
      (err) => {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          try { fs.unlinkSync(tempFilePath); } catch {}
        }
        if (err) {
          console.error(`Error sending ${ext}:`, err);
          return api.sendMessage(`⚠️ ${isVideo ? "ভিডিও" : "অডিও"} পাঠাতে সমস্যা হয়েছে। ফাইল সাইজ ফেসবুক লিমিটের বেশি হতে পারে।`, threadID, messageID);
        }
      },
      messageID
    );

  } catch (err) {
    console.error(err);

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch {}
    }

    if (waitMsg?.messageID) {
      try { await api.unsendMessage(waitMsg.messageID, threadID); } catch {}
    }

    return api.sendMessage("⚠️ ফাইলটি অনেক বড় হওয়ার কারণে অথবা এপিআই সার্ভারে ত্রুটির কারণে প্রসেস করা যায়নি।", threadID, messageID);
  }
}
