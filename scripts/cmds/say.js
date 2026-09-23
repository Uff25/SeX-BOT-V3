const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");

const V = { boys: "boys", girls: "girls" };
const L = { bn: "bn-BD", en: "en-US", hi: "hi-IN", ur: "ur-PK", ar: "ar-SA", es: "es-ES", fr: "fr-FR", de: "de-DE", ja: "ja-JP", ko: "ko-KR", zh: "zh-CN", ru: "ru-RU", pt: "pt-BR", tr: "tr-TR", vi: "vi-VN", id: "id-ID", th: "th-TH" };
const VL = Object.keys(V);
const LL = Object.keys(L);

module.exports = {
  config: {
    name: "say",
    version: "2.0.0",
    author: "Azadx69x",
    countDown: 5,
    role: 0,
    description: "Text to speech",
    category: "utility",
    guide: "{pn} <text> | [voice] | [lang] | [mp3/mp4]"
  },
  onStart: async function({ message, args }) {
    const t = args.join(" ");
    if (!t) return message.reply("❌ Provide text!");
    let text = t, voice = "girls", lang = "bn", fmt = "mp3";
    const parts = t.split(/[\|\-]/).map(p => p.trim()).filter(Boolean);
    text = parts[0] || t;
    for (let i = 1; i < parts.length; i++) {
      const p = parts[i].toLowerCase();
      if (["mp3", "mp4"].includes(p)) fmt = p;
      else if (VL.includes(p)) voice = p;
      else if (LL.includes(p)) lang = p;
    }
    const v = V[voice] || voice;
    const l = L[lang] || lang;
    try {
      const url = `https://azadx69x.is-a.dev/api/voice-tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(v)}&language=${encodeURIComponent(l)}&format=${encodeURIComponent(fmt)}`;
      const res = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
      const file = path.join(os.tmpdir(), `tts_${Date.now()}.mp3`);
      fs.writeFileSync(file, Buffer.from(res.data));
      await message.reply({ body: "✅ Done!", attachment: fs.createReadStream(file) });
      setTimeout(() => { if (fs.existsSync(file)) fs.unlinkSync(file); }, 10000);
    } catch (e) { message.reply(`❌ ${e.message}`); }
  },
  onChat: async function({ message, event, args }) {
    if (event.messageReply && args[0]?.toLowerCase() === "say") {
      const txt = event.messageReply.body;
      if (!txt) return;
      const voice = ["boys", "girls"][Math.floor(Math.random() * 2)];
      try {
        const url = `https://azadx69x.is-a.dev/api/voice-tts?text=${encodeURIComponent(txt)}&voice=${encodeURIComponent(voice)}&language=bn-BD&format=mp3`;
        const res = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 });
        const file = path.join(os.tmpdir(), `tts_${Date.now()}.mp3`);
        fs.writeFileSync(file, Buffer.from(res.data));
        await message.reply({ body: `🎲 Random Voice: ${voice}`, attachment: fs.createReadStream(file) });
        setTimeout(() => { if (fs.existsSync(file)) fs.unlinkSync(file); }, 10000);
      } catch (e) { message.reply(`❌ ${e.message}`); }
    }
  }
};
