const moment = require("moment-timezone");

// ═════════════════════════════════════
// 🔐 PROTECTED AUTHOR
// ═════════════════════════════════════

const PROTECTED_AUTHOR = "ARIYAN AHMED SABBIR";


// ═════════════════════════════════════
// ✏️ EDITABLE INFORMATION
// ═════════════════════════════════════

// 👑 Owner Name — এটা পরিবর্তন করা যাবে
const OWNER_NAME = "𝗔𝗥𝗜𝗬𝗔𝗡 𝗦𝗔𝗕𝗕𝗜𝗥";

// 🤖 Bot Name — এটা পরিবর্তন করা যাবে
const BOT_NAME = "𝗔𝗥𝗜𝗬𝗔𝗡 𝗖𝗛𝗔𝗧 𝗕𝗢𝗧";

// 🏷️ Bot Nickname — এটা পরিবর্তন করা যাবে
const BOT_NICKNAME = "👑༺𓆩 রানীসাহেবা 𓆪༻👑";


// ═════════════════════════════════════
// 🔐 AUTHOR SECURITY CHECK
// ═════════════════════════════════════

function securityCheck() {
  try {
    return (
      module.exports?.config?.author === PROTECTED_AUTHOR
    );
  } catch {
    return false;
  }
}


// ═════════════════════════════════════
// 📦 MODULE
// ═════════════════════════════════════

module.exports = {

  config: {
    name: "pending",
    version: "3.3",

    // 🔐 Author Protected
    author: PROTECTED_AUTHOR,

    countDown: 5,
    role: 2,

    shortDescription: {
      en: "Manage pending group requests"
    },

    longDescription: {
      en: "View, approve or refuse groups waiting for bot access"
    },

    category: "owner",

    guide: {
      en: {
        body:
          "{pn}\n" +
          "Reply with number(s) to approve.\n\n" +
          "Cancel/Refuse:\n" +
          "c <number>\n" +
          "cancel <number>\n\n" +
          "Example:\n" +
          "{pn}\n" +
          "1 2\n" +
          "c 3"
      }
    }
  },


  // ═════════════════════════════════════
  // 💬 LANGUAGE / MESSAGES
  // ═════════════════════════════════════

  langs: {

    en: {

      invalid:
        "❌ Invalid selection: %1",


      fetchFail:
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "       ❌ 𝗘𝗥𝗥𝗢𝗥\n" +
        "╰━━━━━━━━━━━━━━━━━━╯\n\n" +
        "Unable to load pending groups.\n" +
        "Please try again later.",


      empty:
        "╭━━━━━━━━━━━━━━━━━━╮\n" +
        "       📭 𝗣𝗘𝗡𝗗𝗜𝗡𝗚\n" +
        "╰━━━━━━━━━━━━━━━━━━╯\n\n" +
        "✅ No pending groups found.\n\n" +
        `🤖 ${BOT_NAME}\n` +
        `👑 ${OWNER_NAME}`,


      list:
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "     🔔 𝗣𝗘𝗡𝗗𝗜𝗡𝗚 𝗚𝗥𝗢𝗨𝗣𝗦\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
        "📊 Total Groups : %1\n\n" +
        "%2" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        `🤖 Bot : ${BOT_NAME}\n` +
        `👑 Owner : ${OWNER_NAME}\n` +
        "━━━━━━━━━━━━━━━━━━━━\n\n" +
        "🟢 Reply number(s) → 𝗔𝗣𝗣𝗥𝗢𝗩𝗘\n" +
        "🔴 Reply `c <number>` → 𝗥𝗘𝗙𝗨𝗦𝗘\n\n" +
        "💠 Select carefully!",


      approved:
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "      🎉 𝗔𝗣𝗣𝗥𝗢𝗩𝗘𝗗\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
        "✅ Group request approved successfully!\n\n" +
        "📊 Total Approved : %1\n" +
        `🤖 Bot : ${BOT_NAME}\n` +
        `👑 Owner : ${OWNER_NAME}\n` +
        "⏰ Time : %4\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "🚀 Bot access has been granted.\n" +
        "💠 Welcome to ARIYAN CHAT BOT!\n" +
        "━━━━━━━━━━━━━━━━━━━━",


      refused:
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "       🚫 𝗥𝗘𝗙𝗨𝗦𝗘𝗗\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
        "❌ Group request refused.\n\n" +
        "📊 Total Refused : %1\n" +
        `🤖 Bot : ${BOT_NAME}\n` +
        `👑 Owner : ${OWNER_NAME}\n` +
        "⏰ Time : %4\n\n" +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "🔒 Access has been denied.\n" +
        "━━━━━━━━━━━━━━━━━━━━"
    }
  },


  // ═════════════════════════════════════
  // 🔁 ON REPLY
  // ═════════════════════════════════════

  onReply: async function ({
    api,
    event,
    Reply,
    getLang
  }) {

    // 🔐 Author protection
    if (!securityCheck()) {
      console.log(
        "❌ [pending] SECURITY BLOCK: Author was changed."
      );
      return;
    }


    if (event.senderID != Reply.author)
      return;


    const input =
      String(event.body || "").trim();

    if (!input)
      return;


    const {
      threadID,
      messageID
    } = event;


    const prefix =
      global.GoatBot?.config?.prefix || "/";


    const queue =
      Reply.queue || [];


    if (!queue.length) {

      return api.sendMessage(
        "❌ This pending list has expired.\nPlease run the pending command again.",
        threadID,
        messageID
      );

    }


    const dateTime =
      moment()
        .tz("Asia/Dhaka")
        .format("ddd, YYYY-MMM-DD, HH:mm:ss");


    let done = 0;


    // ═════════════════════════════════════
    // 🚫 REFUSE / CANCEL
    // ═════════════════════════════════════

    if (/^(c|cancel)\b/i.test(input)) {

      const numberPart =
        input
          .replace(/^(c|cancel)\b/i, "")
          .trim();


      const nums =
        numberPart
          .split(/\s+/)
          .filter(Boolean);


      if (!nums.length) {

        return api.sendMessage(
          "❌ Please provide a group number.\n\nExample: c 1",
          threadID,
          messageID
        );

      }


      for (const n of nums) {

        const index = Number(n);


        if (
          !Number.isInteger(index) ||
          index < 1 ||
          index > queue.length
        ) {

          return api.sendMessage(
            getLang("invalid", n),
            threadID,
            messageID
          );

        }


        const targetThreadID =
          queue[index - 1].threadID;


        const groupName =
          queue[index - 1].name ||
          "Unnamed Group";


        try {

          await api.sendMessage(
`╭━━━━━━━━━━━━━━━━━━━━╮
       🚫 𝗔𝗖𝗖𝗘𝗦𝗦 𝗗𝗘𝗡𝗜𝗘𝗗
╰━━━━━━━━━━━━━━━━━━━━╯

📌 Group : ${groupName}

🤖 Bot : ${BOT_NAME}
🔴 Status : Request Refused
👑 Owner : ${OWNER_NAME}
🔗 Prefix : ${prefix}
⏰ Time : ${dateTime}

━━━━━━━━━━━━━━━━━━━━
🔒 Bot access has been denied.
🙏 Thank you for your request.
━━━━━━━━━━━━━━━━━━━━`,
            targetThreadID
          );


          await api.removeUserFromGroup(
            api.getCurrentUserID(),
            targetThreadID
          );


          done++;


        } catch (error) {

          console.log(
            `[pending] Refuse error (${targetThreadID}):`,
            error.message
          );

        }

      }


      return api.sendMessage(
        getLang(
          "refused",
          done,
          OWNER_NAME,
          BOT_NAME,
          dateTime
        ),
        threadID,
        messageID
      );

    }


    // ═════════════════════════════════════
    // ✅ APPROVE
    // ═════════════════════════════════════

    const nums =
      input
        .split(/\s+/)
        .filter(Boolean);


    for (const n of nums) {

      const index = Number(n);


      if (
        !Number.isInteger(index) ||
        index < 1 ||
        index > queue.length
      ) {

        return api.sendMessage(
          getLang("invalid", n),
          threadID,
          messageID
        );

      }


      const targetThreadID =
        queue[index - 1].threadID;


      const groupName =
        queue[index - 1].name ||
        "Unnamed Group";


      const botID =
        api.getCurrentUserID();


      try {

        await api.sendMessage(
`╭━━━━━━━━━━━━━━━━━━━━╮
       ✨ 𝗔𝗖𝗖𝗘𝗦𝗦 𝗚𝗥𝗔𝗡𝗧𝗘𝗗
╰━━━━━━━━━━━━━━━━━━━━╯

📌 Group : ${groupName}

🤖 Bot : ${BOT_NAME}
🟢 Status : Activated
👑 Owner : ${OWNER_NAME}
🔗 Prefix : ${prefix}
⏰ Time : ${dateTime}

━━━━━━━━━━━━━━━━━━━━
🎉 Welcome to ARIYAN CHAT BOT!
🚀 Bot services are now active.
💠 Enjoy the experience!
━━━━━━━━━━━━━━━━━━━━`,
          targetThreadID
        );


        try {

          await api.changeNickname(
            BOT_NICKNAME,
            targetThreadID,
            botID
          );

        } catch (error) {

          console.log(
            `[pending] Nickname error (${targetThreadID}):`,
            error.message
          );

        }


        done++;


      } catch (error) {

        console.log(
          `[pending] Approve error (${targetThreadID}):`,
          error.message
        );

      }

    }


    return api.sendMessage(
      getLang(
        "approved",
        done,
        OWNER_NAME,
        BOT_NAME,
        dateTime
      ),
      threadID,
      messageID
    );

  },


  // ═════════════════════════════════════
  // 🚀 ON START
  // ═════════════════════════════════════

  onStart: async function ({
    api,
    event,
    getLang,
    commandName
  }) {

    // 🔐 Author protection
    if (!securityCheck()) {

      console.log(
        "❌ [pending] SECURITY BLOCK: Author was changed."
      );

      return api.sendMessage(
        "╭━━━━━━━━━━━━━━━━━━━━╮\n" +
        "       🔐 𝗦𝗘𝗖𝗨𝗥𝗜𝗧𝗬\n" +
        "╰━━━━━━━━━━━━━━━━━━━━╯\n\n" +
        "❌ This command is protected.\n" +
        "Author was modified.\n\n" +
        "🔒 Pending command disabled.",
        event.threadID,
        event.messageID
      );

    }


    const {
      threadID,
      messageID,
      senderID
    } = event;


    let text = "";
    let i = 1;


    try {

      const other =
        (await api.getThreadList(
          100,
          null,
          ["OTHER"]
        )) || [];


      const pending =
        (await api.getThreadList(
          100,
          null,
          ["PENDING"]
        )) || [];


      const map = new Map();


      for (const group of [
        ...other,
        ...pending
      ]) {

        if (
          group &&
          group.isGroup &&
          group.isSubscribed &&
          group.threadID
        ) {

          map.set(
            group.threadID,
            group
          );

        }

      }


      const groups =
        [...map.values()];


      if (!groups.length) {

        return api.sendMessage(
          getLang("empty"),
          threadID,
          messageID
        );

      }


      for (const group of groups) {

        text +=
          `╭─ ${i}. ${group.name || "Unnamed Group"}\n` +
          `╰─ 🆔 ${group.threadID}\n\n`;

        i++;

      }


      const messageBody =
        getLang(
          "list",
          groups.length,
          text
        );


      return api.sendMessage(
        messageBody,
        threadID,

        (err, info) => {

          if (err) {

            console.log(
              "[pending] Reply registration error:",
              err
            );

            return;

          }


          global.GoatBot.onReply.set(
            info.messageID,
            {
              commandName,
              author: senderID,
              queue: groups
            }
          );

        },

        messageID
      );


    } catch (error) {

      console.error(
        "[pending] Fetch error:",
        error
      );


      return api.sendMessage(
        getLang("fetchFail"),
        threadID,
        messageID
      );

    }

  }

};


// ═════════════════════════════════════
// 🔐 FINAL AUTHOR INTEGRITY CHECK
// ═════════════════════════════════════

if (!securityCheck()) {

  console.error(
    "╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n" +
    "       🔐 SECURITY BLOCK\n" +
    "╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n" +
    "❌ AUTHOR WAS CHANGED.\n" +
    "🚫 pending.js has been disabled."
  );


  module.exports.onStart =
    async function ({
      api,
      event
    }) {

      return api.sendMessage(
        "🔐 SECURITY ERROR\n\n" +
        "❌ Protected Author was changed.\n" +
        "🚫 Pending command is disabled.",
        event.threadID,
        event.messageID
      );

    };


  module.exports.onReply =
    async function () {
      return;
    };

}
