const { findUid } = global.utils;

const regExCheckURL = /^(?:https?:\/\/)?(?:[^.\/]+\.)?(?:facebook\.com|fb\.com)\//i;
const RESERVED_PATHS = new Set([
        "profile.php", "user.php", "people", "pages", "share", "sharer.php",
        "reel", "watch", "groups", "events", "marketplace", "photo", "photos",
        "permalink.php", "story.php", "login", "dialog", "plugins", "hashtag",
        "search", "public", "home", "bookmarks", "gaming", "messages", "notifications"
]);

function parseFacebookURL(input) {
        const value = String(input || "").trim().replace(/[),.!?]+$/, "");
        const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
        if (!/(^|\.)facebook\.com$|(^|\.)fb\.com$/i.test(url.hostname))
                throw new Error("Not a Facebook URL");
        return url;
}

function getDirectUID(url) {
        for (const key of ["id", "uid", "user_id", "profile_id"]) {
                const value = url.searchParams.get(key);
                if (/^\d+$/.test(value || "")) return value;
        }

        const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
        const first = (parts[0] || "").toLowerCase();
        if (["people", "pages", "profile.php", "user.php"].includes(first)) {
                const numericPart = [...parts].reverse().find(part => /^\d+$/.test(part));
                return numericPart || null;
        }
        return parts.length === 1 && /^\d+$/.test(parts[0]) ? parts[0] : null;
}

function getUsernameCandidate(url) {
        const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
        const first = (parts[0] || "").toLowerCase();

        if (first === "people" || first === "pages")
                return parts[1] && !/^\d+$/.test(parts[1]) ? parts[1] : null;
        if (first === "profile.php" || first === "user.php")
                return url.searchParams.get("username") || url.searchParams.get("name");
        if (!parts[0] || RESERVED_PATHS.has(first)) return null;
        return parts[0];
}

async function resolveFromFacebookAPI(api, username) {
        if (!api || typeof api.getUserID !== "function" || !username) return null;
        const users = await api.getUserID(username);
        if (!Array.isArray(users) || !users.length) return null;

        const wanted = username.toLowerCase();
        const exact = users.find(user => {
                const profile = String(user.profileUrl || "").toLowerCase();
                return profile.split("?")[0].replace(/\/$/, "").endsWith(`/${wanted}`);
        });
        return (exact || users[0])?.userID || null;
}

async function resolveUID(input, api) {
        const url = parseFacebookURL(input);
        const directUID = getDirectUID(url);
        if (directUID) return directUID;

        const username = getUsernameCandidate(url);
        const apiUID = await resolveFromFacebookAPI(api, username);
        if (apiUID) return apiUID;

        return findUid(url.toString());
}

module.exports = {
        config: {
                name: "uid",
                version: "1.0.0",
                author: "Azadx69x",
                countDown: 3,
                role: 0,
                description: {
                        en: "Get Facebook UID"
                },
                category: "info"
        },

        onStart: async function ({ api, message, event, args, usersData }) {

                let uid = "";
                let userName = "";

                if (event.messageReply) {
                        uid = event.messageReply.senderID;
                        userName = (await usersData.get(uid))?.name || "Facebook User";
                }

                else if (!args[0]) {
                        uid = event.senderID;
                        userName = (await usersData.get(uid))?.name || "Facebook User";
                }

                else if (/^\d+$/.test(args[0])) {
                        uid = args[0];
                        userName = (await usersData.get(uid))?.name || "Facebook User";
                }

                else if (regExCheckURL.test(args[0])) {
                        try {
                                uid = await resolveUID(args[0], api);
                                userName = (await usersData.get(uid))?.name || "Facebook User";
                        } catch {
                                return message.reply("❌ Cannot find UID from this link");
                        }
                }

                else {
                        const { mentions } = event;
                        for (const id in mentions) {
                                uid = id;
                                userName = mentions[id].replace("@", "");
                        }
                }

                if (!uid) return message.reply("❌ UID not found");

                return message.reply(uid);
        }
};
