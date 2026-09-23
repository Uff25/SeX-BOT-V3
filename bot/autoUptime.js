const axios = require('axios');
const { config } = global.GoatBot;
const { log, getText } = global.utils;

if (global.timeOutUptime != undefined) {
    clearTimeout(global.timeOutUptime);
    clearInterval(global.timeOutUptime);
    global.timeOutUptime = undefined;
}

// Stop execution if autoUptime is disabled
if (!config.autoUptime.enable)
    return;

let myUrl = config.autoUptime.url;

if (!myUrl) {
    log.warn("AUTO UPTIME", "⚠ config.json autoUptime.url is empty. Ping disabled.");
    return;
}

myUrl = myUrl.replace(/\/$/, '');

log.info("AUTO UPTIME", `📡 Uptime ping enabled. Target: ${myUrl}`);

let status = 'ok';
const interval = (config.autoUptime.timeInterval || 300) * 1000;

async function autoUptime() {
    try {
        // Send ping
        await axios.get(myUrl, { timeout: 10000 });
        
        if (status != 'ok') {
            status = 'ok';
            log.info("UPTIME", "🟢 Bot is online.");
        }
    } catch (e) {
        const err = e.response?.data || e;
        if (status != 'ok') return;
        status = 'failed';
        
        // Error
        if (err.statusAccountBot == "can't login")
            log.err("UPTIME", "🔴 Can't login to Facebook account.");
        else if (err.statusAccountBot == "block spam")
            log.err("UPTIME", "🚫 Account is blocked.");
        else
            log.warn("UPTIME", `⚠ Ping failed: ${e.message} (Status: ${e.response?.status || 'Unknown'})`);
    }
}

global.timeOutUptime = setTimeout(async () => {
    await autoUptime();
    global.timeOutUptime = setInterval(autoUptime, interval);
}, interval);
