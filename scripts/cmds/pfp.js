function getUrl(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value !== "object") return null;

  for (const key of ["uri", "url", "source"]) {
    if (typeof value[key] === "string") return value[key];
  }

  return getUrl(value.photo) || getUrl(value.image);
}

function runWithTimeout(task, timeout = 8000) {
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };

    const timer = setTimeout(() => finish(null), timeout);
    Promise.resolve().then(task).then(finish, () => finish(null));
  });
}

async function getFirstStream(urls) {
  if (!global.utils?.getStreamFromURL) return null;

  for (const url of urls.filter(Boolean)) {
    const stream = await runWithTimeout(
      () => global.utils.getStreamFromURL(url, "", { timeout: 12000 }),
      15000
    );
    if (stream) return stream;
  }

  return null;
}

module.exports = {
  config: {
    name: "pfp",
    aliases: ["pp"],
    version: "0.0.8",
    author: "Azadx69x",
    countDown: 3,
    role: 0,
    shortDescription: "Show profile picture.",
    longDescription: "Get the profile picture of yourself or any user",
    category: "image",
    guide: {
      en: "{pn}[@tag | reply | uid]"
    }
  },

  onStart: async function ({ event, message, args, usersData }) {
    try {
      const targetID =
        (event.type === "message_reply" && event.messageReply?.senderID) ||
        (event.mentions && Object.keys(event.mentions)[0]) ||
        (args[0] && !isNaN(args[0]) && args[0]) ||
        event.senderID;

      const avatarURL = await runWithTimeout(
        () => usersData?.getAvatarUrl?.(targetID),
        15000
      );
      const profileStream = await getFirstStream([getUrl(avatarURL)]);

      if (!profileStream) {
        return message.reply(
          "❌ Could not fetch profile picture."
        );
      }

      return message.reply({
        attachment: profileStream
      });
    } catch (error) {
      console.error("pfp command error:", error);
      return message.reply("❌ Could not fetch profile photos.");
    }
  }
};
