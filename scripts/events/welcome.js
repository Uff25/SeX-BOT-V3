const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require("axios");
const { drawTextWithEmoji } = require("../cmds/assets/emojiCanvas");

const backgroundImages = [
    "https://i.ibb.co/0pXybHGj/0dd9eba2ae2e.png",
    "https://i.ibb.co/pjrwt82W/4f09b5ec4ab0.png",
    "https://i.ibb.co/Kj8Nx1fT/140b243c74b3.png",
    "https://i.ibb.co/KxDnpBc7/9d450423f69d.png"
];

const backgroundCache = new Map();

async function getAvatarUrl(uid, api) {
    try {
        if (typeof api.getAvatarUser === "function") {
            const avatarData = await api.getAvatarUser(uid);
            const avatarURL = avatarData?.[String(uid)];
            if (avatarURL) return avatarURL;
        }
    } catch {}
    try {
        const info = await api.getUserInfo(uid);
        const profile = info?.[String(uid)] || info?.[uid] || {};
        return profile.profilePicUrl || profile.thumbSrc || null;
    } catch {
        return null;
    }
}

async function loadBackgroundImage(url) {
    if (backgroundCache.has(url)) return backgroundCache.get(url);
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 10000
        });
        const img = await loadImage(Buffer.from(response.data));
        backgroundCache.set(url, img);
        return img;
    } catch (e) {
        console.error("[WELCOME] Failed to load background:", url, e.message);
        return null;
    }
}

async function loadImageFromUrl(url) {
    if (!url) return null;
    try {
        const response = await axios.get(url, {
            responseType: "arraybuffer",
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 8000
        });
        return await loadImage(Buffer.from(response.data));
    } catch {
        return null;
    }
}

async function drawProfileImage(ctx, imageUrl, x, y, size, borderColor) {
    const radius = size / 2;
    try {
        const img = await loadImageFromUrl(imageUrl);
        if (!img) throw new Error("no image");

        ctx.shadowColor = borderColor;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = borderColor;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = borderColor;
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - radius, y - radius, size, size);
        ctx.restore();
    } catch {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#374151';
        ctx.fill();
        ctx.fillStyle = borderColor;
        ctx.font = `bold ${radius * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('U', x, y);
    }
}

async function createWelcomeCard(gcImg, userImg, adderImg, userName, userNumber, threadName, adderName) {
    const width = 1200;
    const height = 700;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const selectedBg = backgroundImages[Math.floor(Math.random() * backgroundImages.length)];
    const background = await loadBackgroundImage(selectedBg);

    if (background) {
        ctx.drawImage(background, 0, 0, width, height);
    } else {
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, width, height);
    }

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, width, height);

    await Promise.all([
        drawProfileImage(ctx, gcImg, width / 2, 200, 200, "#ffffff"),
        drawProfileImage(ctx, userImg, 120, height - 100, 150, "#10b981"),
        drawProfileImage(ctx, adderImg, width - 120, 100, 150, "#3b82f6")
    ]);

    const safeName = (s) => (s && s.length > 20 ? s.slice(0, 20) + "…" : s || "?");

    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    await drawTextWithEmoji(ctx, safeName(threadName), width / 2, 350);

    const wg = ctx.createLinearGradient(width / 2 - 180, 360, width / 2 + 180, 360);
    wg.addColorStop(0, "#3b82f6");
    wg.addColorStop(0.5, "#10b981");
    wg.addColorStop(1, "#ec4899");

    ctx.font = 'bold 72px Arial';
    ctx.fillStyle = wg;
    ctx.fillText("WELCOME", width / 2, 450);

    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = "#10b981";
    await drawTextWithEmoji(ctx, safeName(userName), width / 2, 500);

    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(`Member #${userNumber}`, width / 2, 585);

    ctx.textAlign = "left";
    ctx.fillStyle = "#10b981";
    ctx.font = 'bold 26px Arial';
    await drawTextWithEmoji(ctx, safeName(userName), 220, height - 95);

    ctx.textAlign = "right";
    ctx.fillStyle = "#3b82f6";
    ctx.font = 'bold 22px Arial';
    await drawTextWithEmoji(ctx, `Added by: ${safeName(adderName)}`, width - 220, 105);

    return canvas.toBuffer();
}

module.exports = {
    config: {
        name: "welcome",
        version: "2.1",
        author: "Azadx69x",
        category: "events"
    },

    onStart: async ({ api, threadsData, event }) => {
        if (event.logMessageType !== "log:subscribe") return;

        const addedParticipants = event.logMessageData?.addedParticipants;
        if (!addedParticipants || !addedParticipants.length) return;

        const { threadID, author: adderId } = event;
        const addedUser = addedParticipants[0];
        const addedUserId = addedUser.userFbId;
        let userName = addedUser.fullName || "New Member";

        console.log(`[WELCOME] Triggered — user: ${userName} (${addedUserId}) added to thread: ${threadID}`);

        let adderName = "Admin";
        let groupImage = 'https://i.imgur.com/7Qk8k6c.png';
        let threadName = "Group";
        let memberCount = 1;

        try {
            const threadInfo = await threadsData.get(threadID);
            if (threadInfo?.settings?.sendWelcomeMessage === false) {
                console.log(`[WELCOME] Disabled for thread ${threadID}, skipping.`);
                return;
            }
            threadName = threadInfo?.threadName || "Group";
            groupImage = threadInfo?.imageSrc || groupImage;
            memberCount = threadInfo?.members?.length || 1;
        } catch (e) {
            console.error("[WELCOME] threadsData error:", e.message);
        }

        try {
            const adderInfo = await api.getUserInfo(adderId);
            adderName = adderInfo?.[adderId]?.name || adderName;
        } catch (e) {
            console.error("[WELCOME] getUserInfo error:", e.message);
        }

        const userAvatar = await getAvatarUrl(addedUserId, api);
        const adderAvatar = await getAvatarUrl(adderId, api);

        const tempDir = path.join(__dirname, '..', '..', 'temp');
        const tempPath = path.join(tempDir, `welcome_${Date.now()}_${addedUserId}.png`);

        const cleanUp = () => { try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {} };

        try {
            await fs.ensureDir(tempDir);

            const imageBuffer = await createWelcomeCard(
                groupImage, userAvatar, adderAvatar,
                userName, memberCount, threadName, adderName
            );

            fs.writeFileSync(tempPath, imageBuffer);

            const welcomeText = `🌸 𝐖𝐞𝐥𝐜𝐨𝐦𝐞 ${userName}!\n━━━━━━━━━━━━━━━━━━━━\n🌷 𝐓𝐨 𝐨𝐮𝐫 𝐠𝐫𝐨𝐮𝐩 𝐟𝐚𝐦𝐢𝐥𝐲!\n🌟 𝐖𝐞'𝐫𝐞 𝐞𝐱𝐜𝐢𝐭𝐞𝐝 𝐭𝐨 𝐡𝐚𝐯𝐞 𝐲𝐨𝐮!\n🎊 𝐏𝐥𝐞𝐚𝐬𝐞 𝐢𝐧𝐭𝐫𝐨𝐝𝐮𝐜𝐞 𝐲𝐨𝐮𝐫𝐬𝐞𝐥𝐟!\n━━━━━━━━━━━━━━━━━━━━\n🌺 𝐄𝐧𝐣𝐨𝐲 𝐲𝐨𝐮𝐫 𝐬𝐭𝐚𝐲!`;

            await api.sendMessage(
                { body: welcomeText, attachment: fs.createReadStream(tempPath) },
                threadID
            );

            console.log(`[WELCOME] Sent successfully to thread ${threadID}`);
            setTimeout(cleanUp, 10000);

        } catch (error) {
            const errorText = JSON.stringify(error || {}).toLowerCase();
            if (error?.error === 1545012 || error?.error === 1545116 || /thread disabled|not part of the conversation/.test(errorText))
                console.log(`[WELCOME] Thread ${threadID} is unavailable, skipping welcome message.`);
            else
                console.error("[WELCOME] Card error:", error.message);
            cleanUp();
        }
    }
};
