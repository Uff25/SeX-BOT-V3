const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// ⚠️ এখানে আপনার ব্যাকআপ গ্রুপের সঠিক UID দিন
const TARGET_GROUP = "2193910854791732"; 

if (!global.resendCache) global.resendCache = new Map();
fs.ensureDirSync(path.join(__dirname, "cache"));

module.exports = {
  config: {
    name: "resend",
    version: "12.0",
    author: "ARIYAN", 
    countDown: 5,
    role: 1,
    description: "Unsend message backup system with internal user info avatar injection",
    category: "events",
    guide: {
      en: "This is an automated background event. No command required."
    }
  },

  onStart: async function ({ message }) {
    return message.reply(`📌 Resend Backup System চালু আছে।\n\nসব ধরণের ডিলিট হওয়া মেসেজ এবং প্রোফাইল পিকচার সরাসরি ব্যাকআপ গ্রুপে পাঠানো হচ্ছে।`);
  },

  onChat: async function ({ api, event, usersData, threadsData }) {
    try {
      const { type, messageID, senderID, threadID, body, attachments } = event;

      // ===== ১. মেসেজ ক্যাশ করা =====
      if (type === "message" || type === "message_reply") {
        if (messageID && senderID) {
          global.resendCache.set(messageID, {
            body: body || "",
            senderID,
            attachments: attachments || [],
            threadID,
            timestamp: Date.now()
          });

          if (global.resendCache.size > 2000) {
            const oldest = global.resendCache.keys().next().value;
            global.resendCache.delete(oldest);
          }
        }
        return;
      }

      // ===== ২. আনসেন্ড ট্র্যাকিং =====
      if (type === "message_unsend") {
        const msg = global.resendCache.get(messageID);

        let name = "Unknown User";
        let threadName = "Unknown Group";
        let deletedBody = "(No text / Media Content)";
        let avatarUrl = "";

        // বটের ইন্টারনাল ফাংশন দিয়ে নাম ও প্রোফাইল পিকচারের ডাইনামিক ইউআরএল সংগ্রহ
        try {
          const info = await api.getUserInfo(senderID);
          if (info && info[senderID]) {
            name = info[senderID].name || "Unknown User";
            avatarUrl = info[senderID].thumbSrc || ""; 
          }
        } catch (e) {
          try {
            const userData = await usersData.get(senderID);
            name = userData?.name || "Unknown User";
          } catch {}
        }

        // গ্রুপের নাম সংগ্রহ
        try {
          const threadInfo = await api.getThreadInfo(threadID);
          threadName = threadInfo?.threadName || threadInfo?.name || "Unknown Group";
        } catch {
          try {
            const threadData = await threadsData.get(threadID);
            threadName = threadData?.threadName || threadData?.name || "Unknown Group";
          } catch {}
        }

        if (msg) {
          deletedBody = msg.body || "(No text)";
        }

        const text = `🗑️ 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝗨𝗻𝘀𝗲𝗻𝗱 𝗔𝗹𝗲𝗿𝘁 (𝗕𝗮𝗰𝗸𝘂𝗽)

📌 From Group : ${threadName}
👤 Deleted By : ${name}
🆔 UID        : ${senderID}
⏰ Time       : ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}

💬 Deleted Content:
${deletedBody}`;

        const pathsToClean = [];
        const streams = [];

        // ========== বটের ইন্টারনাল টোকেন দিয়ে প্রোফাইল পিকচার ডাউনলোড (১০০% সাকসেস মেথড) ==========
        if (avatarUrl) {
          try {
            const ppPath = path.join(__dirname, "cache", `pp_${senderID}_${Date.now()}.jpg`);
            const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
            
            if (res.data && res.data.byteLength > 100) {
              fs.writeFileSync(ppPath, Buffer.from(res.data));
              pathsToClean.push(ppPath);
              streams.push(fs.createReadStream(ppPath));
            }
          } catch (e) {
            console.log("[resend] Internal Avatar download failed, trying fallback graph URL...");
          }
        }

        // ফলব্যাক মেথড: ইন্টারনাল সোর্স কাজ না করলে পাবলিক গ্রাফ মেথড ট্রাই করবে
        if (streams.length === 0) {
          try {
            const ppPath = path.join(__dirname, "cache", `pp_${senderID}_${Date.now()}.jpg`);
            const fallbackUrl = `https://facebook.com{senderID}/picture?type=large`;
            const res = await axios.get(fallbackUrl, {
              responseType: "arraybuffer",
              headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            if (res.data && res.data.byteLength > 200) {
              fs.writeFileSync(ppPath, Buffer.from(res.data));
              pathsToClean.push(ppPath);
              streams.push(fs.createReadStream(ppPath));
            }
          } catch (e) {
            console.log("[resend] All profile picture methods failed.");
          }
        }

        // ========== ডিলিট করা মিডিয়া অ্যাটাচমেন্ট ডাউনলোড ==========
        if (msg?.attachments?.length > 0) {
          for (const att of msg.attachments) {
            try {
              if (!att.url) continue;

              let ext = ".bin";
              if (att.type === "photo" || att.type === "animated_image") ext = ".jpg";
              else if (att.type === "video") ext = ".mp4";
              else if (att.type === "audio" || att.type === "voice") ext = ".mp3";
              else if (att.type === "sticker") ext = ".png";
              else if (att.type === "share") ext = ".jpg";
              else if (att.filename) ext = path.extname(att.filename) || ".bin";

              const filePath = path.join(__dirname, "cache", `file_${Date.now()}_${Math.floor(Math.random() * 9999)}${ext}`);
              
              const res = await axios.get(att.url, {
                responseType: "arraybuffer",
                timeout: 30000,
                maxRedirects: 5,
                headers: { "User-Agent": "Mozilla/5.0" }
              });

              if (res.data && res.data.byteLength > 500) {
                fs.writeFileSync(filePath, Buffer.from(res.data));
                pathsToClean.push(filePath);
                streams.push(fs.createReadStream(filePath));
              }
            } catch (e) {
              console.log("[resend] Attachment error:", e.message);
            }
          }
        }

        // ========== শুধুমাত্র ব্যাকআপ গ্রুপে অ্যালার্ট পাঠানো ==========
        if (TARGET_GROUP) {
          api.sendMessage(
            {
              body: text,
              attachment: streams.length > 0 ? streams : undefined
            },
            TARGET_GROUP,
            () => {
              // ফাইল ক্যাশ পরিষ্কার করা
              pathsToClean.forEach(p => {
                try {
                  if (fs.existsSync(p)) fs.unlinkSync(p);
                } catch {}
              });
            }
          );
        }

        global.resendCache.delete(messageID);
      }
    } catch (err) {
      console.log("[resend] Error:", err.message || err);
    }
  }
};
