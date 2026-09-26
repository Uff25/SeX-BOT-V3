const os = require("os");
const moment = require("moment-timezone");
const mongoose = require("mongoose");
const Canvas = require("canvas");
const fs = require("fs");
const path = require("path");

/* =========================================================
   🤖 ARIYAN CHAT BOT — UPTIME SETTINGS
========================================================= */

const BOT_NAME = "ARIYAN CHAT BOT";
const OWNER_NAME = "ARIYAN SABBIR";
const AUTHOR_NAME = "ARIYAN AHMED SABBIR";

/*
 * 🖼️ Background image
 *
 * এই ছবিটা uptime.js এর একই folder-এ রাখবে:
 *
 * uptime.js
 * uptime_bg.png
 *
 * Background না থাকলেও command কাজ করবে।
 */
const BACKGROUND_PATH = path.join(__dirname, "uptime_bg.png");

module.exports = {
  config: {
    name: "uptime",
    version: "4.0",
    role: 0,
    author: AUTHOR_NAME,
    description: "Premium system analytics and uptime card for ARIYAN CHAT BOT",
    category: "system",
    guide: "{pn}",
    countDown: 5
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, timestamp } = event;

    try {
      /* =====================================================
         ⏳ LOADING MESSAGE
      ===================================================== */

      const sendLoading = await api.sendMessage(
        "⏳ 𝐆𝐞𝐧𝐞𝐫𝐚𝐭𝐢𝐧𝐠 𝐀𝐑𝐈𝐘𝐀𝐍 𝐒𝐲𝐬𝐭𝐞𝐦 𝐀𝐧𝐚𝐥𝐲𝐭𝐢𝐜𝐬...",
        threadID
      );

      /* =====================================================
         ⏱️ UPTIME
      ===================================================== */

      const uptime = process.uptime();

      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const mins = Math.floor((uptime % 3600) / 60);
      const secs = Math.floor(uptime % 60);

      /* =====================================================
         💾 RAM
      ===================================================== */

      const usedRam = (
        process.memoryUsage().rss /
        1024 /
        1024
      ).toFixed(1);

      const totalRam = (
        os.totalmem() /
        1024 /
        1024 /
        1024
      ).toFixed(1);

      const freeRam = (
        os.freemem() /
        1024 /
        1024 /
        1024
      ).toFixed(1);

      /* =====================================================
         🖥️ CPU
      ===================================================== */

      const cpuUsage = os.loadavg()[0].toFixed(2);
      const cpuCores = os.cpus().length;
      const cpuModel = os.cpus()[0]?.model || "Unknown CPU";
      const cpuSpeed = os.cpus()[0]?.speed || "Unknown";
      const architecture = os.arch();

      /* =====================================================
         🗄️ DATABASE
      ===================================================== */

      const dbStatus =
        mongoose.connection.readyState === 1
          ? "Connected"
          : "Disconnected";

      const dbStatusColor =
        mongoose.connection.readyState === 1
          ? "#00ff88"
          : "#ff3366";

      /* =====================================================
         🕒 TIME
      ===================================================== */

      const timeNow = moment
        .tz("Asia/Dhaka")
        .format("hh:mm:ss A");

      const dateNow = moment
        .tz("Asia/Dhaka")
        .format("DD/MM/YYYY");

      const timezone = "Asia/Dhaka (GMT+6)";

      /* =====================================================
         ⚡ LATENCY
      ===================================================== */

      const latency = Date.now() - timestamp;

      /* =====================================================
         🎨 GENERATE IMAGE
      ===================================================== */

      const imagePath = await generateUptimeImage({
        days,
        hours,
        mins,
        secs,

        usedRam,
        totalRam,
        freeRam,

        cpuUsage,
        cpuCores,
        cpuModel,
        cpuSpeed,
        architecture,

        dbStatus,
        dbStatusColor,

        timeNow,
        dateNow,
        timezone,

        latency,

        nodeVersion: process.version,
        mongooseVersion: mongoose.version,

        platform: os.platform(),
        hostname: os.hostname(),
        osType: os.type(),
        osRelease: os.release()
      });

      /* =====================================================
         ❌ REMOVE LOADING
      ===================================================== */

      if (sendLoading && sendLoading.messageID) {
        await api.unsendMessage(
          sendLoading.messageID,
          threadID
        );
      }

      /* =====================================================
         📤 SEND RESULT
      ===================================================== */

      return api.sendMessage(
        {
          body:
            `╭━━━〔 🤖 ${BOT_NAME} 〕━━━╮\n` +
            `┃ ⚡ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐀𝐍𝐀𝐋𝐘𝐓𝐈𝐂𝐒\n` +
            `┃ 👑 𝐎𝐰𝐧𝐞𝐫: ${OWNER_NAME}\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━╯`,
          attachment: fs.createReadStream(imagePath)
        },
        threadID,
        () => {
          try {
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          } catch (err) {
            console.error(
              "Image cleanup error:",
              err
            );
          }
        },
        messageID
      );

    } catch (error) {
      console.error(
        "ARIYAN Uptime Error:",
        error
      );

      return api.sendMessage(
        "❌ 𝐅𝐚𝐢𝐥𝐞𝐝 𝐭𝐨 𝐠𝐞𝐧𝐞𝐫𝐚𝐭𝐞 𝐬𝐲𝐬𝐭𝐞𝐦 𝐚𝐧𝐚𝐥𝐲𝐭𝐢𝐜𝐬 𝐜𝐚𝐫𝐝.",
        threadID,
        messageID
      );
    }
  }
};


/* =========================================================
   🎨 GENERATE UPTIME IMAGE
========================================================= */

async function generateUptimeImage(data) {

  const width = 1100;
  const height = 900;

  const canvas = Canvas.createCanvas(
    width,
    height
  );

  const ctx = canvas.getContext("2d");

  /* =======================================================
     🖼️ BACKGROUND
  ======================================================= */

  if (fs.existsSync(BACKGROUND_PATH)) {

    try {

      const background =
        await Canvas.loadImage(
          BACKGROUND_PATH
        );

      /*
       * Cover image
       */
      const scale = Math.max(
        width / background.width,
        height / background.height
      );

      const bgWidth =
        background.width * scale;

      const bgHeight =
        background.height * scale;

      const bgX =
        (width - bgWidth) / 2;

      const bgY =
        (height - bgHeight) / 2;

      ctx.drawImage(
        background,
        bgX,
        bgY,
        bgWidth,
        bgHeight
      );

      /*
       * Dark overlay for readable text
       */
      ctx.fillStyle =
        "rgba(8, 5, 25, 0.72)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

    } catch (error) {

      console.log(
        "Background image error:",
        error.message
      );

      drawDefaultBackground(
        ctx,
        width,
        height
      );
    }

  } else {

    drawDefaultBackground(
      ctx,
      width,
      height
    );
  }

  /* =======================================================
     ✨ DECORATION
  ======================================================= */

  ctx.globalAlpha = 0.06;

  for (let i = 0; i < 12; i++) {

    ctx.beginPath();

    ctx.arc(
      width - 100 + i * 55,
      100 + i * 45,
      120,
      0,
      Math.PI * 2
    );

    ctx.fillStyle = "#ffffff";
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  /* =======================================================
     🟣 TOP HEADER
  ======================================================= */

  ctx.fillStyle =
    "rgba(0,0,0,0.70)";

  ctx.fillRect(
    0,
    0,
    width,
    90
  );

  ctx.font =
    'bold 36px Arial';

  ctx.fillStyle =
    "#00ff88";

  ctx.shadowBlur = 12;
  ctx.shadowColor =
    "#00ff88";

  ctx.fillText(
    "⚡ ARIYAN SYSTEM ANALYTICS",
    45,
    57
  );

  ctx.shadowBlur = 0;

  ctx.font =
    "bold 17px Arial";

  ctx.fillStyle =
    "rgba(255,255,255,0.65)";

  ctx.fillText(
    "ARIYAN CHAT BOT • PREMIUM EDITION",
    width - 345,
    55
  );

  /* =======================================================
     📦 CARDS
  ======================================================= */

  const cards = [
    [30, 120, 480, 275],
    [540, 120, 530, 275],
    [30, 425, 1040, 205],
    [30, 655, 1040, 205]
  ];

  for (const [x, y, w, h] of cards) {

    ctx.fillStyle =
      "rgba(0,0,0,0.58)";

    ctx.shadowBlur = 10;
    ctx.shadowColor =
      "rgba(0,0,0,0.45)";

    ctx.fillRect(
      x,
      y,
      w,
      h
    );

    ctx.shadowBlur = 0;

    ctx.strokeStyle =
      "rgba(0,255,136,0.65)";

    ctx.lineWidth = 1;

    ctx.strokeRect(
      x,
      y,
      w,
      h
    );
  }

  /* =======================================================
     📊 TITLES
  ======================================================= */

  ctx.font =
    "bold 22px Arial";

  ctx.fillStyle =
    "#00ff88";

  ctx.fillText(
    "📊 UPTIME STATUS",
    50,
    160
  );

  ctx.fillStyle =
    "#ffaa00";

  ctx.fillText(
    "🖥️ SYSTEM RESOURCES",
    560,
    160
  );

  ctx.fillStyle =
    "#ff66cc";

  ctx.fillText(
    "💻 CPU & PROCESSOR INFO",
    50,
    465
  );

  ctx.fillStyle =
    "#66ffcc";

  ctx.fillText(
    "📡 DATABASE & TIMEZONE",
    50,
    695
  );

  /* =======================================================
     ⏱️ UPTIME
  ======================================================= */

  ctx.font =
    "18px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "⏱️ Uptime:",
    60,
    210
  );

  ctx.font =
    "bold 32px Arial";

  ctx.fillStyle =
    "#00ff88";

  ctx.fillText(
    `${data.days}d ${data.hours}h ${data.mins}m`,
    200,
    215
  );

  ctx.font =
    "18px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "⏱️ Seconds:",
    60,
    265
  );

  ctx.font =
    "bold 25px Arial";

  ctx.fillStyle =
    "#00ff88";

  ctx.fillText(
    `${data.secs}s`,
    200,
    270
  );

  ctx.font =
    "18px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "⚡ Latency:",
    60,
    320
  );

  ctx.font =
    "bold 25px Arial";

  ctx.fillStyle =
    data.latency < 100
      ? "#00ff88"
      : "#ffaa00";

  ctx.fillText(
    `${data.latency}ms`,
    200,
    325
  );

  ctx.font =
    "18px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🌐 Status:",
    60,
    370
  );

  ctx.font =
    "bold 21px Arial";

  ctx.fillStyle =
    "#00ff88";

  ctx.fillText(
    "● ONLINE",
    200,
    375
  );

  /* =======================================================
     💾 RAM
  ======================================================= */

  const ramPercent =
    (
      data.usedRam /
      (data.totalRam * 1024)
    ) * 100;

  const ramBarWidth = 280;

  const ramUsedWidth =
    Math.min(
      (ramPercent / 100) *
      ramBarWidth,
      ramBarWidth
    );

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    `RAM USAGE: ${data.usedRam}MB / ${data.totalRam}GB`,
    560,
    195
  );

  ctx.fillStyle =
    "rgba(255,255,255,0.18)";

  ctx.fillRect(
    560,
    210,
    ramBarWidth,
    25
  );

  ctx.fillStyle =
    ramPercent > 80
      ? "#ff3366"
      : "#00ff88";

  ctx.fillRect(
    560,
    210,
    ramUsedWidth,
    25
  );

  ctx.font =
    "14px Arial";

  ctx.fillStyle =
    "#cccccc";

  ctx.fillText(
    `${ramPercent.toFixed(1)}% Used`,
    860,
    195
  );

  ctx.fillText(
    `Free: ${data.freeRam}GB`,
    560,
    260
  );

  /* =======================================================
     📈 LOAD
  ======================================================= */

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "📈 LOAD AVERAGE:",
    560,
    305
  );

  let loadColor = "#00ff88";

  if (data.cpuUsage > 2)
    loadColor = "#ffaa00";

  if (data.cpuUsage > 4)
    loadColor = "#ff3366";

  ctx.font =
    "bold 28px Arial";

  ctx.fillStyle =
    loadColor;

  ctx.fillText(
    `${data.cpuUsage}`,
    760,
    310
  );

  ctx.font =
    "14px Arial";

  ctx.fillStyle =
    "#cccccc";

  ctx.fillText(
    "(1 minute avg)",
    850,
    310
  );

  /* =======================================================
     🖥️ PLATFORM
  ======================================================= */

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🖥️ PLATFORM:",
    560,
    360
  );

  ctx.fillStyle =
    "#cccccc";

  ctx.fillText(
    `${data.platform} (${data.osType})`,
    700,
    360
  );

  /* =======================================================
     💻 CPU INFO
  ======================================================= */

  let y = 505;

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🔧 CPU Model:",
    60,
    y
  );

  ctx.font =
    "14px Arial";

  ctx.fillStyle =
    "#00ff88";

  let cpuName =
    data.cpuModel || "Unknown CPU";

  if (cpuName.length > 75) {
    cpuName =
      cpuName.substring(0, 75) +
      "...";
  }

  ctx.fillText(
    cpuName,
    200,
    y
  );

  y += 40;

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "⚡ CPU Cores:",
    60,
    y
  );

  ctx.font =
    "bold 20px Arial";

  ctx.fillStyle =
    "#ffaa00";

  ctx.fillText(
    `${data.cpuCores} Cores`,
    200,
    y + 2
  );

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🚀 CPU Speed:",
    400,
    y
  );

  ctx.font =
    "bold 20px Arial";

  ctx.fillStyle =
    "#ffaa00";

  ctx.fillText(
    `${data.cpuSpeed} MHz`,
    540,
    y + 2
  );

  y += 40;

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🏗️ Architecture:",
    60,
    y
  );

  ctx.font =
    "bold 20px Arial";

  ctx.fillStyle =
    "#ff66cc";

  ctx.fillText(
    `${data.architecture}`,
    200,
    y + 2
  );

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "💾 Node.js:",
    400,
    y
  );

  ctx.font =
    "bold 20px Arial";

  ctx.fillStyle =
    "#ff66cc";

  ctx.fillText(
    `${data.nodeVersion}`,
    540,
    y + 2
  );

  y += 40;

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🖥️ Hostname:",
    60,
    y
  );

  ctx.font =
    "bold 18px Arial";

  ctx.fillStyle =
    "#cccccc";

  ctx.fillText(
    `${data.hostname}`,
    200,
    y + 2
  );

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🐧 OS Release:",
    400,
    y
  );

  ctx.font =
    "bold 18px Arial";

  ctx.fillStyle =
    "#cccccc";

  let osRelease =
    data.osRelease || "Unknown";

  if (osRelease.length > 40) {
    osRelease =
      osRelease.substring(0, 40) +
      "...";
  }

  ctx.fillText(
    osRelease,
    540,
    y + 2
  );

  /* =======================================================
     🗄️ DATABASE
  ======================================================= */

  let y2 = 735;

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "📦 Database:",
    60,
    y2
  );

  ctx.font =
    "bold 18px Arial";

  ctx.fillStyle =
    data.dbStatusColor;

  ctx.fillText(
    `● ${data.dbStatus}`,
    200,
    y2 + 2
  );

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🛢️ DB Name:",
    400,
    y2
  );

  ctx.fillStyle =
    "#cccccc";

  ctx.fillText(
    "MONGODB",
    540,
    y2 + 2
  );

  y2 += 45;

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "📦 Mongoose:",
    60,
    y2
  );

  ctx.fillStyle =
    "#00ff88";

  ctx.fillText(
    `v${data.mongooseVersion}`,
    200,
    y2 + 2
  );

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "🌍 Timezone:",
    400,
    y2
  );

  ctx.fillStyle =
    "#ffaa00";

  ctx.fillText(
    data.timezone,
    540,
    y2 + 2
  );

  y2 += 45;

  ctx.font =
    "bold 16px Arial";

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    "📅 Date:",
    60,
    y2
  );

  ctx.fillText(
    data.dateNow,
    200,
    y2 + 2
  );

  ctx.fillText(
    "🕐 Server Time:",
    400,
    y2
  );

  ctx.fillStyle =
    "#00ff88";

  ctx.fillText(
    data.timeNow,
    540,
    y2 + 2
  );

  /* =======================================================
     👑 FOOTER
  ======================================================= */

  ctx.fillStyle =
    "rgba(0,0,0,0.72)";

  ctx.fillRect(
    0,
    height - 45,
    width,
    45
  );

  ctx.font =
    "bold 13px Arial";

  ctx.fillStyle =
    "rgba(255,255,255,0.65)";

  ctx.fillText(
    `© ${AUTHOR_NAME} | ${BOT_NAME}`,
    45,
    height - 17
  );

  ctx.fillText(
    `Generated: ${moment().format("HH:mm:ss")}`,
    width - 220,
    height - 17
  );

  /* =======================================================
     ✨ SCAN LINES
  ======================================================= */

  ctx.globalAlpha = 0.035;

  for (let i = 0; i < 25; i++) {

    ctx.fillStyle =
      "#ffffff";

    ctx.fillRect(
      0,
      100 + i * 35,
      width,
      1
    );
  }

  ctx.globalAlpha = 1;

  /* =======================================================
     💾 SAVE IMAGE
  ======================================================= */

  const cacheDir =
    path.join(__dirname, "cache");

  if (!fs.existsSync(cacheDir)) {

    fs.mkdirSync(
      cacheDir,
      { recursive: true }
    );
  }

  const tempFilePath =
    path.join(
      cacheDir,
      `uptime_${Date.now()}.png`
    );

  const buffer =
    canvas.toBuffer("image/png");

  fs.writeFileSync(
    tempFilePath,
    buffer
  );

  return tempFilePath;
}


/* =========================================================
   🎨 DEFAULT BACKGROUND
   Background image না থাকলে এটা ব্যবহার হবে।
========================================================= */

function drawDefaultBackground(
  ctx,
  width,
  height
) {

  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

  gradient.addColorStop(
    0,
    "#09001f"
  );

  gradient.addColorStop(
    0.45,
    "#302b63"
  );

  gradient.addColorStop(
    1,
    "#12002b"
  );

  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );

  /* Neon circles */

  ctx.globalAlpha = 0.08;

  for (let i = 0; i < 12; i++) {

    ctx.beginPath();

    ctx.arc(
      100 + i * 100,
      100 + (i % 4) * 190,
      100,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "#ffffff";

    ctx.fill();
  }

  ctx.globalAlpha = 1;
}
