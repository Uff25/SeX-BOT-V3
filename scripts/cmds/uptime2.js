const os = require("os");
const { bold } = require("fontstyles");

// ===============================
// 🔐 PROTECTED AUTHOR
// ===============================
const PROTECTED_AUTHOR = "ARIYAN AHMED SABBIR";

// ===============================
// ⚙️ EDITABLE SETTINGS
// ===============================
const BOT_NAME = "𝗔𝗥𝗜𝗬𝗔𝗡 𝗖𝗛𝗔𝗧 𝗕𝗢𝗧";
const OWNER_NAME = "𝗔𝗥𝗜𝗬𝗔𝗡 𝗦𝗔𝗕𝗕𝗜𝗥";

// Powered By
const POWERED_BY = "ARIYAN SABBIR";

module.exports = {
  config: {
    name: "uptime2",
    aliases: ["upt2", "up2"],
    version: "2.1",
    author: PROTECTED_AUTHOR,
    countDown: 15,
    role: 0,

    shortDescription: "Display bot uptime",

    longDescription: {
      en: "Display bot uptime and complete system statistics."
    },

    category: "system",

    guide: {
      en: "{pn}: Display bot uptime and system statistics."
    }
  },

  onStart: async function ({
    message,
    event,
    usersData,
    threadsData,
    api
  }) {

    // ===============================
    // 🔐 AUTHOR SECURITY
    // ===============================
    if (this.config.author !== PROTECTED_AUTHOR) {
      return message.reply(
        "⚠️ Unauthorized author change detected.\n\n" +
        "❌ Command execution stopped."
      );
    }

    const startTime = Date.now();

    try {

      // ===============================
      // 📊 DATABASE DATA
      // ===============================
      const users = await usersData.getAll();
      const groups = await threadsData.getAll();

      // ===============================
      // ⏱️ UPTIME
      // ===============================
      const uptime = process.uptime();

      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);

      // ===============================
      // 🕒 BANGLADESH TIME
      // ===============================
      const bangladeshTime = new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      });

      // ===============================
      // 💾 RAM
      // ===============================
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;

      const memPercentage =
        (usedMemory / totalMemory * 100).toFixed(1);

      const barLength = 10;

      const filledBar = Math.min(
        barLength,
        Math.round((memPercentage / 100) * barLength)
      );

      const ramBar =
        "█".repeat(filledBar) +
        "▒".repeat(barLength - filledBar);

      const usedMemoryGB =
        (usedMemory / 1024 / 1024 / 1024).toFixed(2);

      const totalMemoryGB =
        (totalMemory / 1024 / 1024 / 1024).toFixed(2);

      // ===============================
      // 🖥️ CPU
      // ===============================
      const cpuInfo = os.cpus();
      const cpuCount = cpuInfo.length || 1;

      const cpuModel =
        cpuInfo[0]?.model?.split("@")[0]?.trim() || "Unknown CPU";

      const load = os.loadavg();

      const cpuLoad =
        Math.min(
          100,
          (load[0] / cpuCount) * 100
        ).toFixed(1);

      // ===============================
      // 💻 SYSTEM INFO
      // ===============================
      const nodeVersion = process.version;
      const platform = os.platform();
      const arch = os.arch();

      // ===============================
      // 📡 PING
      // ===============================
      const botPing = Date.now() - startTime;

      // ===============================
      // 🖼️ MEDIA BAN STATUS
      // ===============================
      const mediaBan =
        await threadsData.get(event.threadID, "mediaBan") || false;

      const mediaStatus =
        mediaBan ? "🚫 Restricted" : "✅ Active";

      // ===============================
      // 📊 DASHBOARD
      // ===============================
      const dashboard =

`╭━━━━━━━━━━━━━━━━━━━━━━╮
      ⚙️ ${bold("SYSTEM DASHBOARD")}
╰━━━━━━━━━━━━━━━━━━━━━━╯

🤖 ${bold("BOT INFORMATION")}
╭──────────────────────
│ 🏷️ Bot: ${BOT_NAME}
│ 👑 Owner: ${OWNER_NAME}
│ 📡 Status: 🟢 Online
╰──────────────────────

⏱️ ${bold("UPTIME")}
╭──────────────────────
│ 🕒 ${days}d ${hours}h ${minutes}m ${seconds}s
│ ⚡ Ping: ${botPing}ms
╰──────────────────────

💾 ${bold("RESOURCE USAGE")}
╭──────────────────────
│ 📟 RAM: [${ramBar}]
│ 📊 Usage: ${memPercentage}%
│ 📥 ${usedMemoryGB}GB / ${totalMemoryGB}GB
│ 🛡️ CPU Load: ${cpuLoad}%
╰──────────────────────

🖥️ ${bold("SYSTEM INFORMATION")}
╭──────────────────────
│ 🔧 CPU: ${cpuModel}
│ 🧠 Cores: ${cpuCount}
│ 📦 Node.js: ${nodeVersion}
│ 💻 OS: ${platform}
│ 🏗️ Arch: ${arch}
╰──────────────────────

📊 ${bold("BOT STATISTICS")}
╭──────────────────────
│ 👥 Users: ${users.length}
│ 🏘️ Groups: ${groups.length}
│ 🖼️ Media: ${mediaStatus}
╰──────────────────────

🕒 ${bold("BANGLADESH TIME")}
╭──────────────────────
│ 🇧🇩 ${bangladeshTime}
╰──────────────────────

╭━━━━━━━━━━━━━━━━━━━━━━╮
│ 🟢 All Systems Operational
│
│ ⚡ Powered by ${POWERED_BY}
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

      // ===============================
      // 🔄 LOADING ANIMATION
      // ===============================
      const loadingFrames = [
        "『 ▒▒▒▒▒▒▒▒▒▒ 』 0%",
        "『 ██▒▒▒▒▒▒▒▒ 』 25%",
        "『 █████▒▒▒▒▒ 』 50%",
        "『 ███████▒▒▒ 』 75%",
        "『 ██████████ 』 100%"
      ];

      let sentMessage = await message.reply(
        `🔄 ${bold("Fetching System Data...")}\n\n${loadingFrames[0]}`
      );

      const sleep = (ms) =>
        new Promise(resolve => setTimeout(resolve, ms));

      for (const frame of loadingFrames) {

        await sleep(500);

        await api.editMessage(
          `⚙️ ${bold("SYSTEM DASHBOARD")}\n\n${frame}`,
          sentMessage.messageID
        );
      }

      // ===============================
      // ✅ FINAL DASHBOARD
      // ===============================
      await sleep(500);

      await api.editMessage(
        dashboard,
        sentMessage.messageID
      );

    } catch (err) {

      console.error("uptime2 error:", err);

      return message.reply(
        "❌ System data fetch failed.\n" +
        "Please try again later."
      );
    }
  }
};
