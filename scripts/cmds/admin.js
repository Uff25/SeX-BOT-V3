const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

module.exports = {
  config: {
    name: "admin",
    aliases: ["ad"],
    version: "0.0.7",
    author: "Azadx69x",
    countDown: 5,
    role: 4,
    shortDescription: { en: "Add, remove or view the admin list" },
    longDescription: { en: "Manage bot admins — add/remove/view" },
    category: "admin",
    guide: { en: "Usage:\n{pn} list\n{pn} add <uid|tag|reply>\n{pn} remove <uid|tag|reply>" }
  },

  langs: {
    en: {
      listAdmin: `📋 ADMIN LIST\n%1\nTotal: %2`,
      noAdmin: `📭 No admins found.\n💡 Use: {pn} add <uid|@user>`,
      added: `✅ Admin added:\n%1\n📊 Total: %2`,
      alreadyAdmin: `⚠️ Already admin:\n%1`,
      removed: `❌ Admin removed:\n%1\n📊 Total: %2`,
      notAdmin: `⚠️ Not an admin:\n%1`,
      missingIdAdd: `⚠️ Tag a user, reply to a message, or provide UID.`,
      missingIdRemove: `⚠️ Tag a user, reply to a message, or provide UID.`,
      notAllowed: `⛔ You need to be an admin to add or remove admins.`
    }
  },

  onStart: async function ({ message, args, event, usersData, getLang }) {
    const senderID = event.senderID;
    const prefix = global.GoatBot.config.prefix || "/";

    const getName = async (uid) => {
      uid = uid.toString();
      try {
        const name = await usersData.getName(uid);
        return name || "Unknown";
      } catch {
        return "Unknown";
      }
    };

    const formatAdmin = async (uid) => {
      const name = await getName(uid);
      return `★ ${name}, ${uid}`;
    };

    if (args[0] === "list" || args[0] === "-l") {
      if (!config.adminBot.length) return message.reply(getLang("noAdmin").replace(/{pn}/g, prefix));
      const adminList = await Promise.all(config.adminBot.map(formatAdmin));
      return message.reply(getLang("listAdmin", adminList.join("\n"), config.adminBot.length));
    }

    if (!config.adminBot.includes(senderID) && ["add", "-a", "remove", "-r"].includes(args[0]))
      return message.reply(getLang("notAllowed"));

    let uids = [];
    if (event.mentions && Object.keys(event.mentions).length) {
      uids = Object.keys(event.mentions);
    } else if (event.type === "message_reply" && event.messageReply?.senderID) {
      uids = [event.messageReply.senderID];
    } else {
      uids = args.slice(1).filter(a => !isNaN(a));
    }
    uids = uids.map(u => u.toString());

    if (args[0] === "add" || args[0] === "-a") {
      if (!uids.length) return message.reply(getLang("missingIdAdd"));

      const newAdmins = [];
      const alreadyAdmins = [];

      for (const uid of uids) {
        if (config.adminBot.includes(uid)) alreadyAdmins.push(uid);
        else newAdmins.push(uid);
      }

      config.adminBot.push(...newAdmins);
      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const newList = await Promise.all(newAdmins.map(formatAdmin));
      const alreadyList = await Promise.all(alreadyAdmins.map(formatAdmin));

      let msg = "";
      if (newList.length) msg += getLang("added", newList.join("\n\n"), config.adminBot.length);
      if (alreadyList.length) msg += (msg ? "\n\n" : "") + getLang("alreadyAdmin", alreadyList.join("\n\n"));

      return message.reply(msg);
    }

    if (args[0] === "remove" || args[0] === "-r") {
      if (!uids.length) return message.reply(getLang("missingIdRemove"));

      const removed = [];
      const notAdmins = [];

      for (const uid of uids) {
        if (config.adminBot.includes(uid)) {
          removed.push(uid);
          config.adminBot.splice(config.adminBot.indexOf(uid), 1);
        } else notAdmins.push(uid);
      }

      writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

      const removedList = await Promise.all(removed.map(formatAdmin));
      const notList = await Promise.all(notAdmins.map(formatAdmin));

      let msg = "";
      if (removedList.length) msg += getLang("removed", removedList.join("\n\n"), config.adminBot.length);
      if (notList.length) msg += (msg ? "\n\n" : "") + getLang("notAdmin", notList.join("\n\n"));

      return message.reply(msg);
    }

    return message.reply(
`📋 ADMIN COMMANDS
{pn} list - View all admins
{pn} add - Add an admin
{pn} remove - Remove an admin
💡 Tag, reply or provide UID`.replace(/{pn}/g, prefix)
    );
  }
};
