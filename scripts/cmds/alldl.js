const axios = require("axios");

async function downloadVideo(api, event, url, usersData) {
  const { threadID, messageID } = event;
  const senderID = event.senderID || event.author;
  let senderName = "Unknown User";
  try {
    senderName = await usersData?.getName(senderID) || senderName;
  }
  catch (e) {}

  try {
    api.setMessageReaction("📥", messageID, () => {}, true);
  } catch (e) {}

  console.log(`[ALDL] Fast downloading: ${url}`);

  const apiUrl = `https://azadx69x-alldl-cdi-bai.vercel.app/alldl?url=${encodeURIComponent(url)}&quality=sd`;

  try {
    const res = await axios.get(apiUrl, {
      responseType: "stream",
      timeout: 60000,
      maxContentLength: 50 * 1024 * 1024,
      maxBodyLength: 50 * 1024 * 1024,
     headers: {
       'Accept': '*/*',
       'Connection': 'keep-alive'
      },
      decompress: true,
      httpAgent: new (require('http').Agent)({ keepAlive: true }),
      httpsAgent: new (require('https').Agent)({ keepAlive: true }),
      validateStatus: () => true
    });

    if (!res.data)
      throw new Error("Empty response");

    const contentType = String(res.headers?.["content-type"] || "").toLowerCase();
    if (res.status < 200 || res.status >= 300 || contentType.includes("application/json")) {
      const errorBody = await readStream(res.data);
      let details;
      try {
        details = JSON.parse(errorBody);
      }
      catch (e) {}
      throw new Error(details?.error || details?.message || `Downloader returned HTTP ${res.status}`);
    }

    const msg = `╭〔 𝗔𝗹𝗹 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗿 〕\n├‣👋𝗛𝗲𝘆: ${senderName}\n├‣✅𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱𝗲𝗱 𝗖𝗼𝗺𝗽𝗶𝗹𝗲𝗱\n╰‣ 🤖 𝗫𝟲𝟵𝗫 𝗕𝗢𝗧 𝗩𝟯`;

    await new Promise((resolve, reject) => {
      try {
        api.sendMessage({
          body: msg,
          attachment: res,
          mentions: senderID ? [{ id: senderID, tag: senderName }] : undefined
        }, threadID, (err, info) => {
          if (err)
            return reject(err);
          try {
            api.setMessageReaction("✅", messageID, () => {}, true);
          }
          catch (e) {}
          resolve(info);
        }, messageID);
      }
      catch (error) {
        reject(error);
      }
    });

    console.log(`[ALDL] Fast success: ${url}`);

  }
  catch (err) {
    const errorMessage = err?.message || err?.errorDescription || err?.errorSummary || err?.error
      || (typeof err === "string" ? err : JSON.stringify(err)) || "Unknown error";
    console.error("[ALDL Error]", errorMessage);

    try {
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
    catch (e) {}
    api.sendMessage(`❌ Download failed: ${errorMessage}`, threadID, messageID);
  }
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream)
    chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

 module.exports = {
 config: {
   name: "alldl",
   version: "0.0.7",
   author: "Azadx69x",
   role: 0,
   category: "media",
   description: "Fast video download from FB, TikTok, IG, YouTube"
 },
 
  onStart: async function ({ api, event, args, usersData }) {
   let url = null;
   
   if (event.messageReply) {
     const replyBody = event.messageReply.body || "";
     const replyAttachments = event.messageReply.attachments || [];
     
     const bodyMatch = replyBody.match(/(https?:\/\/[^\s]+)/g);
     if (bodyMatch) url = bodyMatch[0];
     
     if (!url && replyAttachments.length > 0) {
       const att = replyAttachments[0];
       if (att.type === "video" || att.type === "share") {
         url = att.url || att.source || att.playable_url;
       }
     }
   }
   
   if (!url && args[0]) {
     url = args[0];
   }
   
   if (!url && event.body) {
     const match = event.body.match(/(https?:\/\/[^\s]+)/g);
     if (match) url = match[0];
   }
   
   if (!url) {
     return api.sendMessage("❌ No URL found!\nUsage: /alldl <url> or reply 'alldl' to a video", event.threadID, event.messageID);
   }

   const valid = ["facebook", "fb.watch", "tiktok", "instagram", "youtu", "youtube"];
    if (!valid.some(d => url.toLowerCase().includes(d))) {
      return api.sendMessage("❌ Unsupported URL!", event.threadID, event.messageID);
    }

     return downloadVideo(api, event, url, usersData);
 },
 
  onChat: async function ({ api, event, usersData }) {
   if (!event.body) return;
   
   const match = event.body.match(/(https?:\/\/[^\s]+)/g);
   if (!match) return;
   
   const url = match[0];
   const valid = ["facebook", "fb.watch", "tiktok", "instagram", "youtu"];
    if (!valid.some(d => url.toLowerCase().includes(d))) return;

     return downloadVideo(api, event, url, usersData);
  }
};
