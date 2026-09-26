const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const BOT_NAME = "ARIYAN CHAT BOT";
const OWNER_NAME = "ARIYAN SABBIR";

module.exports = {
  config: {
    name: "help",
    version: "2.0",
    author: "ARIYAN SABBIR",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "View all bot commands"
    },
    longDescription: {
      en: "View commands, categories, aliases, usage and command information."
    },
    category: "info",
    guide: {
      en: "{pn} [page | command name]\nExample: {pn} 1\nExample: {pn} help"
    },
    priority: 1
  },

  langs: {
    en: {
      menu: `╭━━━〔 🤖 %1 〕━━━╮
┃ 👑 OWNER : %2
┃ 📚 TOTAL : %3 COMMANDS
┃ 📌 PREFIX : %4
╰━━━━━━━━━━━━━━━━━━╯

%5

╭━━━━━━━━━━━━━━━━━━╮
┃ 💡 Type %4help <page>
┃ 📖 Example: %4help 1
╰━━━━━━━━━━━━━━━━━━╯`,

      page: `╭━━━〔 📚 %1 〕━━━╮

%2
╰━━━━━━━━━━━━━━━━━━╯
📄 PAGE : [ %3 / %4 ]
📊 TOTAL : %5 COMMANDS
⚡ PREFIX : [ %6 ]

💡 Use: %6help <page>`,

      commandInfo: `╭━━━〔 ⚡ COMMAND INFO 〕━━━╮
┃ 🤖 BOT : %1
┃ 👑 OWNER : %2
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📌 DETAILS 〕━━━╮
┃ 🏷️ NAME : %3
┃ 📝 DESC : %4
┃ 🔗 ALIAS : %5
┃ 🧬 VERSION : %6
┃ 🛡️ PERMISSION : %7
┃ ⏳ COOLDOWN : %8s
┃ 👤 AUTHOR : %9
╰━━━━━━━━━━━━━━━━━━━━╯

╭━━━〔 📖 USAGE 〕━━━╮
%10
╰━━━━━━━━━━━━━━━━━━━━╯`,

      commandNotFound: `╭━━━〔 ❌ ERROR 〕━━━╮
┃ Command "%1" not found!
╰━━━━━━━━━━━━━━━━━━━━╯

💡 Type %2help to see all commands.`,

      pageNotFound: `❌ Page %1 is out of range!
📖 Please choose a valid help page.`
    }
  },

  onStart: async function ({
    message,
    args,
    event,
    threadsData,
    getLang,
    role
  }) {
    try {
      const threadID = event.threadID;

      // ==============================
      // LANGUAGE
      // ==============================
      const langCode =
        await threadsData.get(
          threadID,
          "data.lang"
        ) ||
        global.GoatBot.config.language ||
        "en";

      // ==============================
      // PREFIX
      // ==============================
      const prefix = getPrefix(threadID);

      // ==============================
      // THREAD DATA
      // ==============================
      const threadData =
        await threadsData.get(threadID);

      // ==============================
      // COMMAND INPUT
      // ==============================
      const input =
        args.join(" ").trim();

      const firstArg =
        (args[0] || "").toLowerCase();

      // ==============================
      // FIND COMMAND
      // ==============================
      const command =
        commands.get(firstArg) ||
        commands.get(
          aliases.get(firstArg)
        );

      // ==================================================
      // COMMAND INFO
      // ==================================================
      if (command && input) {
        const config = command.config;

        let guide =
          config.guide?.[langCode] ||
          config.guide?.en ||
          "";

        if (
          typeof guide === "object"
        ) {
          guide = guide.body || "";
        }

        const usage =
          String(guide)
            .replace(
              /\{pn\}/g,
              prefix + config.name
            )
            .replace(
              /\{p\}/g,
              prefix
            );

        const description =
          config.shortDescription?.[
            langCode
          ] ||
          config.shortDescription?.en ||
          config.description?.[
            langCode
          ] ||
          config.description?.en ||
          "No description available";

        const aliasList =
          Array.isArray(config.aliases) &&
          config.aliases.length
            ? config.aliases.join(", ")
            : "None";

        let permission =
          "All Users";

        if (config.role === 1) {
          permission = "Group Admins";
        } else if (config.role >= 2) {
          permission = "Bot Owner";
        }

        const formattedUsage =
          usage
            ? usage
                .split("\n")
                .map(
                  line =>
                    `┃ ➜ ${line}`
                )
                .join("\n")
            : "┃ ➜ No usage guide available";

        return message.reply(
          getLang(
            "commandInfo",
            BOT_NAME,
            OWNER_NAME,
            config.name.toUpperCase(),
            description,
            aliasList,
            config.version || "1.0.0",
            permission,
            config.countDown || 1,
            config.author || "Unknown",
            formattedUsage
          )
        );
      }

      // ==================================================
      // COMMAND DOES NOT EXIST
      // ==================================================
      if (
        input &&
        isNaN(firstArg)
      ) {
        return message.reply(
          getLang(
            "commandNotFound",
            firstArg,
            prefix
          )
        );
      }

      // ==================================================
      // BUILD COMMAND LIST
      // ==================================================
      const commandList = [];

      for (
        const [name, value]
        of commands
      ) {
        if (!value?.config) continue;

        // Hide commands user doesn't have permission for
        if (
          value.config.role > role
        ) {
          continue;
        }

        commandList.push({
          name,
          priority:
            value.priority ||
            value.config.priority ||
            0,
          category:
            value.config.category ||
            "Others"
        });
      }

      // ==================================================
      // SORT
      // ==================================================
      commandList.sort(
        (a, b) =>
          b.priority - a.priority ||
          a.name.localeCompare(
            b.name
          )
      );

      // ==================================================
      // CATEGORY MENU
      // ==================================================
      const sortByName =
        threadData?.settings
          ?.sortHelp === "name";

      if (
        !args[0] &&
        !sortByName
      ) {
        const categories = {};

        for (
          const cmd
          of commandList
        ) {
          const category =
            String(
              cmd.category
            ).toUpperCase();

          if (
            !categories[category]
          ) {
            categories[category] = [];
          }

          categories[
            category
          ].push(cmd.name);
        }

        let categoryText = "";

        Object.keys(categories)
          .sort()
          .forEach(category => {
            const list =
              categories[category]
                .sort(
                  (a, b) =>
                    a.localeCompare(b)
                )
                .join(" • ");

            categoryText +=
              `\n╭──〔 ${category} 〕\n` +
              `╰➤ ${list}\n`;
          });

        return message.reply(
          getLang(
            "menu",
            BOT_NAME,
            OWNER_NAME,
            commandList.length,
            prefix,
            categoryText
          )
        );
      }

      // ==================================================
      // PAGINATION
      // ==================================================
      const page =
        parseInt(args[0]) || 1;

      const commandsPerPage = 20;

      const totalPages =
        Math.ceil(
          commandList.length /
            commandsPerPage
        );

      if (
        page < 1 ||
        page > totalPages
      ) {
        return message.reply(
          getLang(
            "pageNotFound",
            page
          )
        );
      }

      const start =
        (page - 1) *
        commandsPerPage;

      const pageCommands =
        commandList.slice(
          start,
          start +
            commandsPerPage
        );

      let pageText = "";

      pageCommands.forEach(
        (cmd, index) => {
          pageText +=
            `┃ ${String(
              start + index + 1
            ).padStart(2, "0")}. ` +
            `⚡ ${cmd.name}\n`;
        }
      );

      return message.reply(
        getLang(
          "page",
          BOT_NAME,
          pageText,
          page,
          totalPages,
          commandList.length,
          prefix
        )
      );

    } catch (error) {
      console.error(
        "[HELP ERROR]",
        error
      );

      return message.reply(
        `❌ Help command error!\n` +
        `📌 ${error.message}`
      );
    }
  }
};
