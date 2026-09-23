// getFbstate.js
const axios = require("axios");
const proxyManager = require('./x69x-Proxy.js');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 400, max = 1500) {
    return sleep(Math.floor(Math.random() * (max - min + 1)) + min);
}

const MOBILE_UA = "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36";

const baseHeaders = {
    "accept": "application/json, text/plain, */*",
    "accept-language": "en-US,en;q=0.9",
    "user-agent": MOBILE_UA,
    "sec-ch-ua": "\"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\", \"Not=A?Brand\";v=\"8\"",
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": "\"Android\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site"
};

async function getFbstate(tokenFullPermission, proxy) {
    let cookieCache = global._fbCookieCache || null;
    
    if (cookieCache && cookieCache.expiry > Date.now()) {
        return cookieCache.cookies;
    }

    if (!tokenFullPermission || !tokenFullPermission.startsWith("EAAAA")) {
        throw new Error("Invalid token format. Token must start with EAAAA");
    }

    await randomDelay(300, 800);

    let response1;
    try {
        response1 = await proxyManager.requestWithProxy({
            url: "https://graph.facebook.com/app",
            method: "GET",
            timeout: 20000,
            headers: baseHeaders,
            params: {
                access_token: tokenFullPermission
            }
        }, proxy);
    } catch (err) {
        if (err.response && err.response.status === 403) {
            const err2 = new Error("Token is invalid or expired");
            err2.name = "TOKEN_ERROR";
            throw err2;
        }
        throw err;
    }

    if (response1.data.error) {
        const msg = response1.data.error.message || "Unknown error";
        const err = new Error("Token is invalid: " + msg);
        err.name = "TOKEN_ERROR";
        throw err;
    }

    const appId = response1.data.id;
    await randomDelay(600, 1800);

    let response2;
    try {
        response2 = await proxyManager.requestWithProxy({
            url: "https://api.facebook.com/method/auth.getSessionforApp",
            method: "GET",
            timeout: 20000,
            headers: {
                ...baseHeaders,
                "origin": "https://www.facebook.com",
                "referer": "https://www.facebook.com/"
            },
            params: {
                access_token: tokenFullPermission,
                format: "json",
                new_app_id: appId,
                generate_session_cookies: "1"
            }
        }, proxy);
    } catch (err) {
        if (err.response && err.response.status === 403) {
            const err2 = new Error("Token session error: Token invalid or expired");
            err2.name = "TOKEN_ERROR";
            throw err2;
        }
        throw err;
    }

    if (response2.data.error_code) {
        const msg = response2.data.error_msg || "Unknown error";
        const err = new Error("Token session error: " + msg);
        err.name = "TOKEN_ERROR";
        throw err;
    }

    if (!response2.data.session_cookies || response2.data.session_cookies.length === 0) {
        const err = new Error("Could not retrieve session cookies from token");
        err.name = "TOKEN_ERROR";
        throw err;
    }

    const cookies = response2.data.session_cookies.map(x => {
        x.key = x.name;
        delete x.name;
        return x;
    });

    if (!global._fbCookieCache) {
        global._fbCookieCache = {};
    }
    global._fbCookieCache.cookies = cookies;
    global._fbCookieCache.expiry = Date.now() + (7 * 24 * 60 * 60 * 1000);
    global._fbCookieCache.token = tokenFullPermission;

    return cookies;
}

module.exports = getFbstate;
