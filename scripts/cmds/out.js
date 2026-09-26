const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "out",
    version: "4.0",
    author: "ARIYAN AHMED SABBIR",
    countDown: 5,
    role: 2,

    shortDescription:
      "বটকে গ্রুপ থেকে বের করে দেওয়া এবং বিদায় কার্ড পাঠানো",

    longDescription:
      "বট একটি সুন্দর বিদায় কার্ড ও মেসেজ পাঠিয়ে গ্রুপ থেকে লিভ নেবে।",

    category: "owner",

    guide: {
      en: "{pn} [threadID (optional)]",
    },
  },

  onStart: async function ({ api, event, args }) {
    const botID = api.getCurrentUserID();

    // threadID দেওয়া থাকলে সেটা,
    // না থাকলে বর্তমান গ্রুপ
    const targetThread = args[0] || event.threadID;

    let threadName = "Unknown Group";
    let userName = "Unknown User";

    try {
      // ==========================================
      // GROUP NAME
      // ==========================================

      try {
        const threadInfo = await api.getThreadInfo(targetThread);

        if (threadInfo && threadInfo.threadName) {
          threadName = threadInfo.threadName;
        } else {
          threadName = "Unnamed Group";
        }
      } catch (error) {
        console.error(
          "Group info error:",
          error.message
        );
      }

      // ==========================================
      // USER NAME
      // ==========================================

      try {
        const userInfo = await api.getUserInfo(
          event.senderID
        );

        if (
          userInfo &&
          userInfo[event.senderID] &&
          userInfo[event.senderID].name
        ) {
          userName = userInfo[event.senderID].name;
        }
      } catch (error) {
        console.error(
          "User info error:",
          error.message
        );
      }

      // ==========================================
      // GOODBYE MESSAGE
      // ==========================================

      const goodbyeMessage = `╭━━━〔 🤖 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 〕━━━╮

🥀 আচ্ছা, মে চালতা হুঁ…
দুআওঁ মে ইয়াদ রাখনা। ❤️
দূরে গেলেও এই মুহূর্তগুলো মনে রাখনা। 🥀

━━━━━━━━━━━━━━━━━━

👥 𝐆𝐑𝐎𝐔𝐏
➜ ${threadName}

👤 𝐑𝐄𝐐𝐔𝐄𝐒𝐓𝐄𝐃 𝐁𝐘
➜ ${userName}

━━━━━━━━━━━━━━━━━━

👑 𝐎𝐖𝐍𝐄𝐑 𝐍𝐀𝐌𝐄
➜ 𝐀𝐑𝐈𝐘𝐀𝐍 𝐒𝐀𝐁𝐁𝐈𝐑

🤖 𝐁𝐎𝐓 𝐍𝐀𝐌𝐄
➜ 𝐀𝐑𝐈𝐘𝐀𝐍 𝐂𝐇𝐀𝐓 𝐁𝐎𝐓

╰━━━━━━━━━━━━━━━━━━╯`;

      // ==========================================
      // CACHE FOLDER
      // ==========================================

      const cacheDir = path.join(
        __dirname,
        "cache"
      );

      await fs.ensureDir(cacheDir);

      const imagePath = path.join(
        cacheDir,
        `goodbye_${targetThread}.png`
      );

      // ==========================================
      // IMAGE API
      // ==========================================

      const title =
        "GOODBYE • ARIYAN CHAT BOT";

      const description =
        `${threadName} • Requested by ${userName}`;

      const canvasUrl =
        "https://og-image.org/api/og" +
        "?template=gradient" +
        `&title=${encodeURIComponent(title)}` +
        `&description=${encodeURIComponent(description)}` +
        `&icon=${encodeURIComponent("🤖")}` +
        "&bg=111827" +
        "&text=ffffff" +
        "&accent=8b5cf6" +
        "&format=png";

      let cardSent = false;

      // ==========================================
      // DOWNLOAD GOODBYE CARD
      // ==========================================

      try {
        const response = await axios.get(
          canvasUrl,
          {
            responseType: "arraybuffer",
            timeout: 30000,

            headers: {
              "User-Agent":
                "ARIYAN-CHAT-BOT/4.0",
            },
          }
        );

        // Save image
        await fs.writeFile(
          imagePath,
          Buffer.from(response.data)
        );

        // Check image exists
        if (await fs.pathExists(imagePath)) {
          // ======================================
          // SEND IMAGE + MESSAGE
          // ======================================

          await api.sendMessage(
            {
              body: goodbyeMessage,
              attachment:
                fs.createReadStream(imagePath),
            },
            targetThread
          );

          cardSent = true;

          // ======================================
          // DELETE CACHE
          // ======================================

          setTimeout(async () => {
            try {
              if (
                await fs.pathExists(imagePath)
              ) {
                await fs.remove(imagePath);
              }
            } catch (error) {
              console.error(
                "Cache delete error:",
                error.message
              );
            }
          }, 5000);
        }
      } catch (imageError) {
        console.error(
          "Goodbye card error:",
          imageError.message
        );
      }

      // ==========================================
      // FALLBACK MESSAGE
      // ==========================================

      if (!cardSent) {
        try {
          await api.sendMessage(
            goodbyeMessage,
            targetThread
          );
        } catch (messageError) {
          console.error(
            "Message send error:",
            messageError.message
          );
        }
      }

      // ==========================================
      // BOT LEAVE GROUP
      // ==========================================

      try {
        await new Promise(
          (resolve, reject) => {
            api.removeUserFromGroup(
              botID,
              targetThread,
              (error) => {
                if (error) {
                  return reject(error);
                }

                resolve();
              }
            );
          }
        );
      } catch (leaveError) {
        console.error(
          "Leave group error:",
          leaveError.message
        );

        // Fallback
        try {
          await api.removeUserFromGroup(
            botID,
            targetThread
          );
        } catch (error) {
          console.error(
            "Fallback leave error:",
            error.message
          );
        }
      }
    } catch (error) {
      console.error(
        "OUT COMMAND ERROR:",
        error
      );

      return api.sendMessage(
        "❌ বট গ্রুপ থেকে বের হতে পারেনি!\n\nসম্ভবত বটের প্রয়োজনীয় permission নেই অথবা কোনো সমস্যা হয়েছে।",
        event.threadID
      );
    }
  },
};
