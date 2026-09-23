const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "0.0.8",
    author: "Azadx69x",
    role: 0,
    countDown: 5,
    description: { en: "Show command list or command details" },
    category: "Info",
    guide: { en: "{pn} [command_name]" }
  },
  onStart: async function ({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const input = args[0]?.toLowerCase();
    let cmd = null;

    if (input) {
      if (commands.has(input)) cmd = commands.get(input);
      else if (aliases.has(input)) cmd = commands.get(aliases.get(input));
      else return message.reply(`Command "${input}" does not exist.\nType "${prefix}help" to see all commands.`);
    }

    if (cmd) {
      const c = cmd.config;
      const desc = typeof c.description === "string" ? c.description : c.description?.en || "No description";
      const usage = (typeof c.guide?.en === "string" ? c.guide.en : c.name).replace(/\{pn\}/g, prefix + c.name);
      const aliasesText = c.aliases ? c.aliases.map(a => `${prefix}${a}`).join(", ") : "None";
      const fields = [
        { label: "NAME", value: c.name },
        { label: "CATEGORY", value: c.category || "Uncategorized" },
        { label: "DESC", value: desc },
        { label: "VERSION", value: c.version || "1.0" },
        { label: "COOLDOWN", value: `${c.countDown || 1}s` },
        { label: "ROLE", value: c.role === 0 ? "All" : c.role === 1 ? "Admin" : "Owner" },
        { label: "AUTHOR", value: c.author || "Unknown" },
        { label: "ALIASES", value: aliasesText },
        { label: "USAGE", value: usage }
      ];
      let msg = "";
      for (const f of fields) {
        msg += `❍ ${f.label}\n`;
        const lines = f.value.split('\n');
        for (const line of lines) {
          msg += `    ➥ ${line}\n`;
        }
      }
      return message.reply(msg.trim());
    }

    const all = [];
    for (const [, c] of commands) {
      all.push(c.config.name);
    }

    let msg = "BOT COMMANDS\n";
    for (let i = 0; i < all.length; i += 3) {
      const chunk = all.slice(i, i + 3);
      let line = `  ❍ ${chunk[0]}`;
      if (chunk[1]) line += ` ● ${chunk[1]}`;
      if (chunk[2]) line += ` ★ ${chunk[2]}`;
      msg += line + "\n";
    }

    msg += `◊━━━━━━━━━━━━━━━━━━━━━━━━━━━━◊\n`;
    msg += `❍ Prefix [  ${prefix}  ]\n`;
    msg += `❍ Cmds [${all.length}]`;

    await message.reply(msg);
  }
};
