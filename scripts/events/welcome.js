const { drive } = global.utils;
const { nickNameBot } = global.GoatBot.config;
const { createCanvas, loadImage } = require("canvas");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

/* =========================================================
   ⚙️ ARIYAN CHAT BOT SETTINGS
========================================================= */

const BOT_NAME = "ARIYAN CHAT BOT";
const OWNER_NAME = "ARIYAN SABBIR";
const AUTHOR_NAME = "ARIYAN AHMED SABBIR";

const WHATSAPP_NUMBER = "01937278213";
const FACEBOOK_LINK = "https://www.facebook.com/ItsAriyanSabbir";
const GITHUB_LINK = "https://github.com/ItsAriyan-X/ARIYAN_CHAT_BOT";

/*
   ⚠️ Token সরাসরি কোডে রাখার বদলে Replit Secrets / Environment
   Variables-এ FB_ACCESS_TOKEN নামে রাখাই নিরাপদ।
*/
const ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

/* =========================================================
   📁 CACHE DIRECTORY
========================================================= */

const CACHE_DIR = path.join(__dirname, "welcome_cache");

try {
  fs.ensureDirSync(CACHE_DIR);
} catch (_) {}

/* =========================================================
   📦 MODULE
========================================================= */

module.exports = {
  config: {
    name: "welcome",
    version: "10.0",
    author: AUTHOR_NAME,
    category: "events"
  },

  langs: {
    en: {
      defaultWelcomeMessage:
        "『 ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ ᴛʜᴇ ᴄʟᴀɴ 』\n" +
        "━━━━━━━━━━━━━━━━━━\n" +
        "👋 ʜᴇʟʟᴏ, {userName}!\n" +
        "🏘️ ᴡᴇʟᴄᴏᴍᴇ ᴛᴏ: {threadName}\n" +
        "🕒 ʜᴀᴠᴇ ᴀ ɢᴏᴏᴅ {timeState}\n\n" +
        "[ 📝 ɴᴏᴛᴇ: ᴘʟᴇᴀꜱᴇ ʀᴇᴀᴅ ᴛʜᴇ ɢʀᴏᴜᴘ ʀᴜʟᴇꜱ ᴄᴀʀᴇꜰᴜʟʟʏ ]",

      botAddedMessage:
        "╭━━━〔 🤖 𝐁𝐎𝐓 𝐉𝐎𝐈𝐍𝐄𝐃 〕━━━╮\n\n" +
        "🌸 আমাকে আপনাদের গ্রুপে এড করার জন্য\n" +
        "অসংখ্য ধন্যবাদ। ❤️\n\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "🤖 𝐁𝐎𝐓\n" +
        "➜ {botName}\n\n" +
        "👥 𝐆𝐑𝐎𝐔𝐏\n" +
        "➜ {threadName}\n\n" +
        "👤 𝐀𝐃𝐃𝐄𝐃 𝐁𝐘\n" +
        "➜ {inviterName}\n\n" +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "⚠️ কোনো সমস্যা হলে,\n" +
        "আমার বসকে মেসেজ করুন।\n\n" +
        "👑 𝐁𝐎𝐒𝐒 : {ownerName}\n\n" +
        "💬 𝐖𝐇𝐀𝐓𝐒𝐀𝐏𝐏\n" +
        "➜ {whatsapp}\n\n" +
        "🔵 𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊\n" +
        "➜ {facebook}\n\n" +
        "🐙 𝐆𝐈𝐓𝐇𝐔𝐁\n" +
        "➜ {github}\n\n" +
        "╰━━━━━━━━━━━━━━━━━━╯"
    }
  },

  onStart: async ({
    threadsData,
    message,
    event,
    api,
    usersData,
    getLang
  }) => {
    try {
      if (event.logMessageType !== "log:subscribe") return;

      const { threadID } = event;
      if (!threadID) return;

      const threadData = await threadsData.get(threadID);
      if (!threadData) return;

      if (
        threadData.settings &&
        threadData.settings.sendWelcomeMessage === false
      ) {
        return;
      }

      const addedMembers =
        event.logMessageData &&
        Array.isArray(event.logMessageData.addedParticipants)
          ? event.logMessageData.addedParticipants
          : [];

      if (!addedMembers.length) return;

      const threadName = threadData.threadName || "Our Group";
      const prefix = global.utils.getPrefix(threadID);
      const inviterID = event.author || null;

      let inviterName = "Unknown";

      if (inviterID) {
        try {
          inviterName = await usersData.getName(inviterID);
        } catch (_) {
          inviterName = "Unknown";
        }
      }

      const botID = api.getCurrentUserID();

      /* =====================================================
         🕒 TIME
      ===================================================== */

      const hours = new Date().getHours();

      let timeState = "day";

      if (hours >= 5 && hours < 12) {
        timeState = "morning";
      } else if (hours >= 12 && hours < 17) {
        timeState = "afternoon";
      } else if (hours >= 17 && hours < 20) {
        timeState = "evening";
      } else {
        timeState = "night";
      }

      /* =====================================================
         👥 PROCESS MEMBERS
      ===================================================== */

      for (const user of addedMembers) {
        const userID = user.userFbId;

        if (!userID) continue;

        /* ===================================================
           🤖 BOT ADDED
        =================================================== */

        if (String(userID) === String(botID)) {
          try {
            if (nickNameBot) {
              try {
                await api.changeNickname(
                  nickNameBot,
                  threadID,
                  botID
                );
              } catch (_) {}
            }

            let botCardPath = null;

            try {
              botCardPath = await createBotJoinedCard({
                threadName,
                inviterName,
                inviterID,
                threadID,
                api
              });
            } catch (err) {
              console.error(
                "[WELCOME] Bot card error:",
                err
              );
            }

            let caption = getLang(
              "botAddedMessage",
              prefix
            );

            caption = caption
              .replace(/\{botName\}/g, BOT_NAME)
              .replace(/\{ownerName\}/g, OWNER_NAME)
              .replace(/\{whatsapp\}/g, WHATSAPP_NUMBER)
              .replace(/\{facebook\}/g, FACEBOOK_LINK)
              .replace(/\{github\}/g, GITHUB_LINK)
              .replace(/\{threadName\}/g, threadName)
              .replace(/\{inviterName\}/g, inviterName);

            const form = {
              body: caption
            };

            if (
              botCardPath &&
              fs.existsSync(botCardPath)
            ) {
              form.attachment =
                fs.createReadStream(botCardPath);
            }

            await message.send(form);

            if (
              botCardPath &&
              fs.existsSync(botCardPath)
            ) {
              setTimeout(() => {
                safeDelete(botCardPath);
              }, 10000);
            }
          } catch (err) {
            console.error(
              "[WELCOME] Bot joined error:",
              err
            );
          }

          continue;
        }

        /* ===================================================
           👤 NEW MEMBER
        =================================================== */

        const userName =
          user.fullName ||
          user.name ||
          "New Member";

        let memberCount = 0;

        try {
          if (Array.isArray(event.participantIDs)) {
            memberCount = event.participantIDs.length;
          } else if (
            threadData.participantIDs &&
            Array.isArray(threadData.participantIDs)
          ) {
            memberCount =
              threadData.participantIDs.length;
          }
        } catch (_) {
          memberCount = 0;
        }

        if (!memberCount) {
          memberCount = "NEW";
        }

        let welcomeMessage =
          threadData.data &&
          threadData.data.welcomeMessage
            ? threadData.data.welcomeMessage
            : getLang("defaultWelcomeMessage");

        welcomeMessage = String(welcomeMessage)
          .replace(
            /\{userName\}/g,
            userName
          )
          .replace(
            /\{userTag\}/g,
            userName
          )
          .replace(
            /\{threadName\}/g,
            threadName
          )
          .replace(
            /\{memberCount\}/g,
            memberCount
          )
          .replace(
            /\{inviterName\}/g,
            inviterName
          )
          .replace(
            /\{timeState\}/g,
            timeState
          );

        /* ===================================================
           🎨 CREATE WELCOME CARD
        =================================================== */

        let welcomeImagePath = null;

        try {
          welcomeImagePath =
            await createWelcomeCard({
              userName,
              threadName,
              memberCount,
              inviterName,
              newUserID: userID,
              inviterID,
              threadID,
              api
            });
        } catch (err) {
          console.error(
            "[WELCOME] Welcome card error:",
            err
          );
        }

        const form = {
          body: welcomeMessage,
          mentions: [
            {
              tag: userName,
              id: userID
            }
          ]
        };

        if (
          welcomeImagePath &&
          fs.existsSync(welcomeImagePath)
        ) {
          form.attachment =
            fs.createReadStream(
              welcomeImagePath
            );
        } else if (
          threadData.data &&
          Array.isArray(
            threadData.data.welcomeAttachment
          ) &&
          threadData.data.welcomeAttachment.length
        ) {
          try {
            const attachments =
              threadData.data.welcomeAttachment.map(
                file =>
                  drive.getFile(
                    file,
                    "stream"
                  )
              );

            const results =
              await Promise.allSettled(
                attachments
              );

            const validAttachments =
              results
                .filter(
                  r =>
                    r.status ===
                    "fulfilled"
                )
                .map(
                  r => r.value
                );

            if (validAttachments.length) {
              form.attachment =
                validAttachments;
            }
          } catch (_) {}
        }

        await message.send(form);

        if (
          welcomeImagePath &&
          fs.existsSync(welcomeImagePath)
        ) {
          setTimeout(() => {
            safeDelete(
              welcomeImagePath
            );
          }, 10000);
        }
      }
    } catch (err) {
      console.error(
        "[WELCOME] Main error:",
        err
      );
    }
  }
};

/* =========================================================
   🗑️ SAFE DELETE
========================================================= */

function safeDelete(filePath) {
  try {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }
  } catch (_) {}
}

/* =========================================================
   📥 DOWNLOAD FACEBOOK PROFILE
========================================================= */

async function downloadHighQualityProfile(userID) {
  try {
    if (!ACCESS_TOKEN || !userID) {
      return null;
    }

    const url =
      `https://graph.facebook.com/${encodeURIComponent(userID)}/picture` +
      `?width=800&height=800&access_token=${encodeURIComponent(
        ACCESS_TOKEN
      )}`;

    const res = await axios({
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeout: 10000
    });

    return Buffer.from(res.data);
  } catch (_) {
    return null;
  }
}

/* =========================================================
   🖼️ DOWNLOAD IMAGE
========================================================= */

async function downloadImage(url) {
  try {
    if (!url) return null;

    const res = await axios({
      method: "GET",
      url,
      responseType: "arraybuffer",
      timeout: 10000
    });

    return Buffer.from(res.data);
  } catch (_) {
    return null;
  }
}

/* =========================================================
   🏠 GROUP IMAGE
========================================================= */

async function getGroupImage(threadID, api) {
  try {
    const info =
      await api.getThreadInfo(threadID);

    if (
      info &&
      info.imageSrc
    ) {
      return await downloadImage(
        info.imageSrc
      );
    }
  } catch (_) {}

  return null;
}

/* =========================================================
   🔤 UNICODE → PLAIN
========================================================= */

function unicodeToPlain(str) {
  if (!str) return "";

  const ranges = [
    [0x1D400, 0x1D419, "A"],
    [0x1D41A, 0x1D433, "a"],
    [0x1D434, 0x1D44D, "A"],
    [0x1D44E, 0x1D467, "a"],
    [0x1D468, 0x1D481, "A"],
    [0x1D482, 0x1D49B, "a"],
    [0x1D5D4, 0x1D5ED, "A"],
    [0x1D5EE, 0x1D607, "a"],
    [0x1D63C, 0x1D655, "A"],
    [0x1D656, 0x1D66F, "a"],
    [0x1D7CE, 0x1D7D7, "0"],
    [0xFF21, 0xFF3A, "A"],
    [0xFF41, 0xFF5A, "a"],
    [0xFF10, 0xFF19, "0"],
    [0x24B6, 0x24CF, "A"],
    [0x24D0, 0x24E9, "a"]
  ];

  const singles = {
    0x1D49C: "A",
    0x212C: "B",
    0x2102: "C",
    0x2145: "D",
    0x2130: "E",
    0x2131: "F",
    0x210A: "g",
    0x210B: "H",
    0x2110: "I",
    0x2111: "I",
    0x2112: "L",
    0x2113: "l",
    0x2115: "N",
    0x2118: "P",
    0x211A: "Q",
    0x211B: "R",
    0x211C: "R",
    0x2124: "Z",
    0x2128: "Z",
    0x2070: "0",
    0x00B9: "1",
    0x00B2: "2",
    0x00B3: "3",
    0x2074: "4",
    0x2075: "5",
    0x2076: "6",
    0x2077: "7",
    0x2078: "8",
    0x2079: "9"
  };

  let result = "";

  for (const char of String(str)) {
    const cp =
      char.codePointAt(0);

    if (
      singles[cp] !== undefined
    ) {
      result += singles[cp];
      continue;
    }

    let mapped = false;

    for (
      const [start, end, base]
      of ranges
    ) {
      if (
        cp >= start &&
        cp <= end
      ) {
        const baseCode =
          base.codePointAt(0);

        result +=
          String.fromCodePoint(
            baseCode +
              (cp - start)
          );

        mapped = true;
        break;
      }
    }

    if (!mapped) {
      result += char;
    }
  }

  return result;
}

/* =========================================================
   🧹 SAFE STRING
========================================================= */

function safeStr(str) {
  if (!str) return "";

  try {
    return Buffer
      .from(String(str), "latin1")
      .toString("utf8");
  } catch (_) {
    return String(str);
  }
}

/* =========================================================
   👤 CIRCLE AVATAR
========================================================= */

function drawCircleAvatar(
  ctx,
  img,
  cx,
  cy,
  r
) {
  if (!img) return;

  ctx.save();

  ctx.beginPath();
  ctx.arc(
    cx,
    cy,
    r,
    0,
    Math.PI * 2
  );

  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    img,
    cx - r,
    cy - r,
    r * 2,
    r * 2
  );

  ctx.restore();
}

/* =========================================================
   💜 AVATAR BORDER
========================================================= */

function drawAvatarBorder(
  ctx,
  cx,
  cy,
  r,
  width = 4
) {
  ctx.save();

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    r + 3,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    "#c026ff";

  ctx.lineWidth = width;

  ctx.shadowColor =
    "#8b2cff";

  ctx.shadowBlur = 18;

  ctx.stroke();

  ctx.restore();
}

/* =========================================================
   🔲 ROUNDED RECT
========================================================= */

function roundedRect(
  ctx,
  x,
  y,
  width,
  height,
  radius
) {
  ctx.beginPath();

  ctx.moveTo(
    x + radius,
    y
  );

  ctx.lineTo(
    x + width - radius,
    y
  );

  ctx.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius
  );

  ctx.lineTo(
    x + width,
    y + height - radius
  );

  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height
  );

  ctx.lineTo(
    x + radius,
    y + height
  );

  ctx.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius
  );

  ctx.lineTo(
    x,
    y + radius
  );

  ctx.quadraticCurveTo(
    x,
    y,
    x + radius,
    y
  );

  ctx.closePath();
}

/* =========================================================
   🌈 COLORFUL USER NAME
========================================================= */

function drawColorfulName(
  ctx,
  text,
  x,
  y,
  maxWidth = 850
) {
  let name = String(
    text || "NEW MEMBER"
  )
    .trim()
    .toUpperCase();

  if (name.length > 25) {
    name =
      name.substring(0, 25) +
      "...";
  }

  let fontSize = 42;

  ctx.font =
    `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;

  while (
    ctx.measureText(name).width >
      maxWidth &&
    fontSize > 25
  ) {
    fontSize -= 2;

    ctx.font =
      `bold ${fontSize}px "Segoe UI", Arial, sans-serif`;
  }

  const textWidth =
    ctx.measureText(name).width;

  const gradient =
    ctx.createLinearGradient(
      x - textWidth / 2,
      0,
      x + textWidth / 2,
      0
    );

  /*
     🌈 Gradient Colors
  */

  gradient.addColorStop(
    0,
    "#ff4ecd"
  );

  gradient.addColorStop(
    0.25,
    "#c084fc"
  );

  gradient.addColorStop(
    0.5,
    "#60a5fa"
  );

  gradient.addColorStop(
    0.75,
    "#22d3ee"
  );

  gradient.addColorStop(
    1,
    "#f0abfc"
  );

  ctx.save();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  /*
     ✨ Outer Glow
  */

  ctx.shadowColor =
    "#c026ff";

  ctx.shadowBlur = 28;

  ctx.fillStyle =
    gradient;

  ctx.fillText(
    name,
    x,
    y
  );

  /*
     ✨ Stronger Glow
  */

  ctx.shadowColor =
    "#60a5fa";

  ctx.shadowBlur = 12;

  ctx.fillText(
    name,
    x,
    y
  );

  ctx.restore();
}

/* =========================================================
   🤖 BOT JOINED CARD
========================================================= */

async function createBotJoinedCard({
  threadName,
  inviterName,
  inviterID,
  threadID,
  api
}) {
  const W = 1200;
  const H = 675;

  const canvas =
    createCanvas(W, H);

  const ctx =
    canvas.getContext("2d");

  const bgPath =
    path.join(
      __dirname,
      "welcome_bg.png"
    );

  if (
    fs.existsSync(bgPath)
  ) {
    try {
      const bg =
        await loadImage(bgPath);

      ctx.drawImage(
        bg,
        0,
        0,
        W,
        H
      );
    } catch (_) {
      ctx.fillStyle =
        "#080514";

      ctx.fillRect(
        0,
        0,
        W,
        H
      );
    }
  } else {
    ctx.fillStyle =
      "#080514";

    ctx.fillRect(
      0,
      0,
      W,
      H
    );
  }

  /*
     Dark Overlay
  */

  ctx.fillStyle =
    "rgba(5, 2, 15, 0.58)";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  /*
     Header
  */

  ctx.textAlign =
    "center";

  ctx.font =
    'bold 58px "Arial"';

  ctx.fillStyle =
    "#ffffff";

  ctx.shadowColor =
    "#a855f7";

  ctx.shadowBlur = 25;

  ctx.fillText(
    "🤖 BOT JOINED",
    W / 2,
    125
  );

  ctx.shadowBlur = 0;

  ctx.font =
    'bold 38px "Arial"';

  ctx.fillStyle =
    "#d9a7ff";

  ctx.fillText(
    BOT_NAME,
    W / 2,
    175
  );

  /*
     Information Box
  */

  const boxX = 170;
  const boxY = 215;
  const boxW = 860;
  const boxH = 260;

  roundedRect(
    ctx,
    boxX,
    boxY,
    boxW,
    boxH,
    35
  );

  ctx.fillStyle =
    "rgba(8, 5, 20, 0.85)";

  ctx.fill();

  ctx.strokeStyle =
    "rgba(190, 100, 255, 0.8)";

  ctx.lineWidth = 4;

  ctx.stroke();

  ctx.textAlign =
    "left";

  ctx.font =
    'bold 28px "Arial"';

  ctx.fillStyle =
    "#ffffff";

  ctx.fillText(
    `👥 Group: ${safeStr(threadName)}`,
    boxX + 45,
    boxY + 70
  );

  ctx.fillText(
    `👤 Added by: ${unicodeToPlain(
      safeStr(inviterName)
    )}`,
    boxX + 45,
    boxY + 130
  );

  ctx.fillText(
    `👑 Owner: ${OWNER_NAME}`,
    boxX + 45,
    boxY + 190
  );

  /*
     Footer
  */

  ctx.textAlign =
    "center";

  ctx.font =
    'bold 25px "Arial"';

  ctx.fillStyle =
    "#f0d7ff";

  ctx.fillText(
    "Thank you for adding me to your group ❤️",
    W / 2,
    545
  );

  ctx.font =
    'bold 18px "Arial"';

  ctx.fillStyle =
    "#c084fc";

  ctx.fillText(
    `© ${AUTHOR_NAME}`,
    W / 2,
    595
  );

  const tempPath =
    path.join(
      CACHE_DIR,
      `temp_bot_joined_${Date.now()}.png`
    );

  await fs.writeFile(
    tempPath,
    canvas.toBuffer("image/png")
  );

  return tempPath;
}

/* =========================================================
   🎨 NEW MEMBER WELCOME CARD
========================================================= */

async function createWelcomeCard({
  userName,
  threadName,
  memberCount,
  inviterName,
  newUserID,
  inviterID,
  threadID,
  api
}) {
  const W = 1200;
  const H = 675;

  const canvas =
    createCanvas(W, H);

  const ctx =
    canvas.getContext("2d");

  /* =====================================================
     👤 LOAD PROFILE
  ===================================================== */

  async function loadProfile(uid) {
    try {
      const buf =
        await downloadHighQualityProfile(
          uid
        );

      if (!buf) return null;

      return await loadImage(buf);
    } catch (_) {
      return null;
    }
  }

  const [
    newUserImg,
    inviterImg
  ] = await Promise.all([
    loadProfile(newUserID),
    loadProfile(inviterID)
  ]);

  /* =====================================================
     🖼️ BACKGROUND
  ===================================================== */

  const bgPath =
    path.join(
      __dirname,
      "welcome_bg.png"
    );

  if (
    fs.existsSync(bgPath)
  ) {
    try {
      const bg =
        await loadImage(bgPath);

      /*
         Cover Background
      */

      const scale =
        Math.max(
          W / bg.width,
          H / bg.height
        );

      const bgW =
        bg.width * scale;

      const bgH =
        bg.height * scale;

      const bgX =
        (W - bgW) / 2;

      const bgY =
        (H - bgH) / 2;

      ctx.drawImage(
        bg,
        bgX,
        bgY,
        bgW,
        bgH
      );
    } catch (_) {
      ctx.fillStyle =
        "#120924";

      ctx.fillRect(
        0,
        0,
        W,
        H
      );
    }
  } else {
    ctx.fillStyle =
      "#120924";

    ctx.fillRect(
      0,
      0,
      W,
      H
    );
  }

  /* =====================================================
     🌑 DARK OVERLAY
  ===================================================== */

  ctx.fillStyle =
    "rgba(5, 2, 18, 0.38)";

  ctx.fillRect(
    0,
    0,
    W,
    H
  );

  /* =====================================================
     ✨ TOP WELCOME TEXT
  ===================================================== */

  ctx.textAlign =
    "center";

  ctx.font =
    'bold 48px "Arial"';

  ctx.fillStyle =
    "#ffffff";

  ctx.shadowColor =
    "#a855f7";

  ctx.shadowBlur = 22;

  ctx.fillText(
    "✦ WELCOME ✦",
    W / 2,
    100
  );

  ctx.shadowBlur = 0;

  ctx.font =
    'bold 24px "Arial"';

  ctx.fillStyle =
    "#e9d5ff";

  ctx.fillText(
    "WELCOME TO OUR FAMILY",
    W / 2,
    140
  );

  /* =====================================================
     👤 USER AVATAR
  ===================================================== */

  const avatarCX = 600;
  const avatarCY = 315;
  const avatarR = 78;

  if (newUserImg) {
    drawCircleAvatar(
      ctx,
      newUserImg,
      avatarCX,
      avatarCY,
      avatarR
    );

    drawAvatarBorder(
      ctx,
      avatarCX,
      avatarCY,
      avatarR,
      5
    );
  } else {
    /*
       Fallback Circle
    */

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      avatarCX,
      avatarCY,
      avatarR,
      0,
      Math.PI * 2
    );

    ctx.fillStyle =
      "rgba(168, 85, 247, 0.35)";

    ctx.shadowColor =
      "#c026ff";

    ctx.shadowBlur = 25;

    ctx.fill();

    ctx.restore();
  }

  /* =====================================================
     🌈 COLORFUL USER NAME
  ===================================================== */

  drawColorfulName(
    ctx,
    userName,
    avatarCX,
    440,
    850
  );

  /* =====================================================
     👑 MEMBER NUMBER
  ===================================================== */

  ctx.textAlign =
    "center";

  ctx.font =
    'bold 21px "Arial"';

  ctx.fillStyle =
    "#e9d5ff";

  ctx.shadowColor =
    "#8b5cf6";

  ctx.shadowBlur = 8;

  ctx.fillText(
    `✦ MEMBER #${memberCount} ✦`,
    avatarCX,
    480
  );

  ctx.shadowBlur = 0;

  /* =====================================================
     👤 ADDED BY
  ===================================================== */

  const inviterCX = 1080;
  const inviterCY = 70;
  const inviterR = 38;

  if (inviterImg) {
    drawCircleAvatar(
      ctx,
      inviterImg,
      inviterCX,
      inviterCY,
      inviterR
    );

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      inviterCX,
      inviterCY,
      inviterR + 2,
      0,
      Math.PI * 2
    );

    ctx.strokeStyle =
      "#bc25ff";

    ctx.lineWidth = 3;

    ctx.shadowColor =
      "#bc25ff";

    ctx.shadowBlur = 10;

    ctx.stroke();

    ctx.restore();
  }

  const plainInviter =
    unicodeToPlain(
      safeStr(inviterName)
    ).trim();

  let inviterDisplay =
    plainInviter || "Unknown";

  if (
    inviterDisplay.length > 18
  ) {
    inviterDisplay =
      inviterDisplay.substring(
        0,
        18
      ) + "...";
  }

  ctx.textAlign =
    "right";

  ctx.font =
    'bold 16px "Arial"';

  ctx.fillStyle =
    "#ffffff";

  ctx.shadowColor =
    "#000000";

  ctx.shadowBlur = 8;

  ctx.fillText(
    `Added by ${inviterDisplay}`,
    1020,
    75
  );

  ctx.shadowBlur = 0;

  /* =====================================================
     🏠 GROUP NAME
  ===================================================== */

  let groupDisplay =
    safeStr(threadName);

  if (
    groupDisplay.length > 35
  ) {
    groupDisplay =
      groupDisplay.substring(
        0,
        35
      ) + "...";
  }

  ctx.textAlign =
    "center";

  ctx.font =
    'bold 18px "Arial"';

  ctx.fillStyle =
    "#ddd6fe";

  ctx.fillText(
    `🏠 ${groupDisplay}`,
    W / 2,
    535
  );

  /* =====================================================
     💜 BOTTOM MESSAGE
  ===================================================== */

  ctx.font =
    'bold 20px "Arial"';

  ctx.fillStyle =
    "#f5e9ff";

  ctx.shadowColor =
    "#8b5cf6";

  ctx.shadowBlur = 8;

  ctx.fillText(
    "✨ Glad to have you with us ✨",
    W / 2,
    575
  );

  ctx.shadowBlur = 0;

  /* =====================================================
     🤖 BOT BRANDING
  ===================================================== */

  ctx.font =
    'bold 15px "Arial"';

  ctx.fillStyle =
    "#c084fc";

  ctx.fillText(
    `${BOT_NAME} • ${AUTHOR_NAME}`,
    W / 2,
    620
  );

  /* =====================================================
     💾 SAVE IMAGE
  ===================================================== */

  const tempPath =
    path.join(
      CACHE_DIR,
      `temp_welcome_${Date.now()}.png`
    );

  await fs.writeFile(
    tempPath,
    canvas.toBuffer("image/png")
  );

  return tempPath;
}
