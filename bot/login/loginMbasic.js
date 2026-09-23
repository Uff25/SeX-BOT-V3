"use strict";

/**
 * ! WARNING: Made for Testing Purposes Only — Account may be suspended!
 * ! Advanced Facebook Login Module
 * ! Anti-Ban Shield
 * ! Proxy Rotation
 * ! Author: @Azadx69x
 */
const axios = require("axios");
const https = require("https");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { URLSearchParams } = require("url");

let HttpsProxyAgent;
try { HttpsProxyAgent = require("https-proxy-agent"); } catch (_) { HttpsProxyAgent = null; }

let SocksProxyAgent;
try { SocksProxyAgent = require("socks-proxy-agent"); } catch (_) { SocksProxyAgent = null; }

let toptp;
try { toptp = require("totp-generator"); } catch (_) { toptp = null; }

const ENDPOINTS = {
	MBASIC: "https://mbasic.facebook.com",
	MFACEBOOK: "https://m.facebook.com",
	WWW: "https://www.facebook.com",
	GRAPH: "https://graph.facebook.com",
	FREE: "https://free.facebook.com",
	ZERO: "https://0.facebook.com"
};

const LOGIN_PATHS = [
	"/login/",
	"/login/?li=off",
	"/login/device-based/",
	"/login/device-based/regular/login/",
	"/login.php"
];

const MOBILE_USER_AGENTS = [
	"Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
	"Mozilla/5.0 (Linux; Android 13; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
	"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
	"Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
	"Mozilla/5.0 (Linux; Android 13; CPH2491) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
	"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.111 Mobile/15E148 Safari/604.1",
	"Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.118 Mobile Safari/537.36",
	"Mozilla/5.0 (Linux; Android 14; V2312A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36",
	"Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36",
	"Mozilla/5.0 (Linux; Android 14; RMX3771) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36"
];

const ACCEPT_LANGUAGES = [
	"en-US,en;q=0.9",
	"en-GB,en;q=0.9,en-US;q=0.8",
	"en-US,en;q=0.9,bn;q=0.8",
	"en-US,en;q=0.9,hi;q=0.8",
	"en-US,en;q=0.8"
];

const REQUIRED_COOKIES = ["c_user", "xs", "datr"];

const TIMEOUTS = {
	REQUEST: 30000,
	SESSION_REFRESH: 40 * 60 * 1000,
	PRESENCE: 2.5 * 60 * 1000,
	RETRY_DELAY: 3000,
	MAX_RETRIES: 3,
	MIN_DELAY: 1200,
	MAX_DELAY: 4800
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomUA = () => MOBILE_USER_AGENTS[rand(0, MOBILE_USER_AGENTS.length - 1)];
const randomLang = () => ACCEPT_LANGUAGES[rand(0, ACCEPT_LANGUAGES.length - 1)];
const pick = arr => arr[rand(0, arr.length - 1)];

function log(level, msg) {
	const tag = `[loginMbasic][${level.toUpperCase()}]`;
	if (level === "error") console.error(tag, msg);
	else if (level === "warn") console.warn(tag, msg);
	else console.log(tag, msg);
}

function parseCookieHeader(setCookieArr, existing = {}) {
	for (const raw of (setCookieArr || [])) {
		const part = raw.split(";")[0].trim();
		const eq = part.indexOf("=");
		if (eq < 0) continue;
		const key = part.slice(0, eq).trim();
		const val = part.slice(eq + 1).trim();
		if (key) existing[key] = val;
	}
	return existing;
}

function cookieObjToJar(obj) {
	return Object.entries(obj).map(([k, v]) => ({
		key: k,
		value: v,
		domain: ".facebook.com",
		path: "/",
		hostOnly: false,
		creation: new Date(),
		lastAccessed: new Date()
	}));
}

function cookieObjToHeader(obj) {
	return Object.entries(obj).map(([k, v]) => `${k}=${v}`).join("; ");
}

function normalizeAppState(appState) {
	if (typeof appState === "string") {
		const raw = appState.trim();
		if (!raw) return [];
		try {
			return normalizeAppState(JSON.parse(raw));
		} catch (_) {
			return raw.split(";")
				.map(part => {
					const separator = part.indexOf("=");
					return separator === -1 ? null : {
						key: part.slice(0, separator).trim(),
						value: part.slice(separator + 1).trim()
					};
				})
				.filter(cookie => cookie?.key && cookie?.value);
		}
	}
	if (Array.isArray(appState)) {
		return appState
			.map(cookie => ({
				...cookie,
				key: cookie?.key || cookie?.name,
				value: cookie?.value
			}))
			.filter(cookie => cookie.key && cookie.value);
	}
	if (appState && typeof appState === "object") {
		return Object.entries(appState).map(([key, value]) => ({ key, value }));
	}
	return [];
}

function extractInput(html, name) {
	const regex1 = new RegExp(`name=["']${name}["'][^>]*value=["']([^"']*?)["']`, "i");
	const regex2 = new RegExp(`value=["']([^"']*?)["'][^>]*name=["']${name}["']`, "i");
	const regex3 = new RegExp(`<input[^>]+name=["']${name}["'][^>]*>`, "i");
	const m = html.match(regex1) || html.match(regex2);
	if (m) return m[1];
	const tag = html.match(regex3);
	if (tag) {
		const v = tag[0].match(/value=["']([^"']*?)["']/i);
		return v ? v[1] : "";
	}
	return "";
}

function extractAllHiddenInputs(html) {
	const inputs = {};
	const tagRegex = /<input[^>]+type=["']hidden["'][^>]*>/gi;
	let match;
	while ((match = tagRegex.exec(html)) !== null) {
		const tag = match[0];
		const nameMatch = tag.match(/name=["']([^"']+)["']/i);
		const valueMatch = tag.match(/value=["']([^"']*?)["']/i);
		if (nameMatch) {
			inputs[nameMatch[1]] = valueMatch ? valueMatch[1] : "";
		}
	}
	return inputs;
}

function extractAction(html, fallback) {
	const m = html.match(/<form[^>]+action=["']([^"']+)["']/i);
	if (!m) return fallback;
	const url = m[1].replace(/&amp;/g, "&");
	if (url.startsWith("http")) return url;
	if (url.startsWith("/")) return ENDPOINTS.MBASIC + url;
	return ENDPOINTS.MBASIC + "/" + url;
}

function hasCheckpoint(html, url = "") {
	return url.includes("/checkpoint") ||
		html.includes("/checkpoint/") ||
		html.includes("id_check") ||
		html.includes("confirm_your_identity") ||
		html.includes("checkpoint_title");
}

function hasSuspend(html, url = "") {
	return url.includes("disabled") ||
		html.includes("account has been disabled") ||
		html.includes("suspended") ||
		html.includes("We've Disabled Your Account") ||
		html.includes("your account has been locked");
}

function has2FA(html, url = "") {
	return url.includes("two_step") ||
		url.includes("approvals_code") ||
		url.includes("two_factor") ||
		html.includes("two-factor") ||
		html.includes("approvals") ||
		html.includes("Enter Login Code") ||
		html.includes("Enter the code") ||
		html.includes("login code");
}

function hasSaveDevice(html) {
	return html.includes("save_device") ||
		html.includes("Don't Save") ||
		html.includes("remember_browser") ||
		html.includes("save-device");
}

function isWrongPassword(html) {
	return html.includes("The password you entered is incorrect") ||
		html.includes("password you've entered is incorrect") ||
		html.includes("The email or mobile number you entered") ||
		html.includes("Invalid username or password") ||
		html.includes("login_error") ||
		html.includes("Please enter a valid password") ||
		html.includes("didn't match any account");
}

function isLoggedIn(html, cookies) {
	if (!(cookies.c_user && cookies.xs)) return false;
	if (html.includes('id="login_form"')) return false;
	if (html.includes("login_form")) return false;
	if (html.includes("login_error")) return false;
	return true;
}

function code2FANorm(secret) {
	return (secret || "").normalize("NFD").toLowerCase()
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[đĐ]/g, x => (x === "đ" ? "d" : "D"))
		.replace(/[(),]/g, "").replace(/ /g, "");
}

function generateLSD() {
	return crypto.randomBytes(8).toString("hex");
}

function generateJazoest(str) {
	let sum = 0;
	for (const ch of str) sum += ch.charCodeAt(0);
	return "2" + sum;
}

function generateDeviceId() {
	return crypto.randomBytes(8).toString("hex").toUpperCase();
}

function generateMachineId() {
	const chars = "abcdef0123456789";
	let out = "";
	for (let i = 0; i < 24; i++) out += chars[rand(0, chars.length - 1)];
	return out;
}

function generateSpinR() {
	return String(rand(1000000000, 4999999999));
}

function generateSpinT() {
	return String(Math.floor(Date.now() / 1000));
}

function generateRev() {
	return String(rand(1000000000, 4999999999));
}

function generateHsi() {
	return String(rand(7000000000000000000, 7999999999999999999));
}

function generateDyn() {
	const parts = [];
	for (let i = 0; i < 8; i++) parts.push(crypto.randomBytes(4).toString("hex"));
	return "7xe" + parts.join("");
}

function generateCsr() {
	return "g" + crypto.randomBytes(8).toString("hex");
}

function generateFbDtsg() {
	return crypto.randomBytes(12).toString("base64").replace(/[+/=]/g, m => ({ "+": "-", "/": "_", "=": "" }[m]));
}

function generateSessionId() {
	return crypto.randomBytes(8).toString("hex");
}

function buildLoginPayload(email, pass, loginPageHtml, opts = {}) {
	const hidden = extractAllHiddenInputs(loginPageHtml);
	const lsd = hidden.lsd || opts.lsd || generateLSD();
	const jazoest = hidden.jazoest || generateJazoest(lsd);
	const mTs = hidden.m_ts || Date.now().toString();
	const deviceId = opts.deviceId || generateDeviceId();
	const machineId = opts.machineId || generateMachineId();

	return {
		lsd,
		jazoest,
		m_ts: mTs,
		li: hidden.li || "off",
		email,
		pass,
		login: "Log In",
		prefill_contact_point: hidden.prefill_contact_point || "",
		prefill_source: hidden.prefill_source || "",
		prefill_type: hidden.prefill_type || "",
		first_prefill_source: hidden.first_prefill_source || "",
		first_prefill_type: hidden.first_prefill_type || "",
		had_cp_prefilled: hidden.had_cp_prefilled || "0",
		had_password_prefilled: hidden.had_password_prefilled || "0",
		is_smart_lock: hidden.is_smart_lock || "0",
		device_id: hidden.device_id || deviceId,
		machine_id: hidden.machine_id || machineId,
		session_key: hidden.session_key || generateSessionId(),
		app_id: hidden.app_id || "1217981644879628",
		client_id: hidden.client_id || "",
		redirect_uri: hidden.redirect_uri || "",
		response_type: hidden.response_type || "",
		scope: hidden.scope || "",
		state: hidden.state || "",
		fb_dtsg: hidden.fb_dtsg || generateFbDtsg(),
		__a: hidden.__a || "1",
		__user: hidden.__user || "0",
		__req: hidden.__req || "1",
		__rev: hidden.__rev || generateRev(),
		__hsi: hidden.__hsi || generateHsi(),
		__dyn: hidden.__dyn || generateDyn(),
		__csr: hidden.__csr || generateCsr(),
		__spin_r: hidden.__spin_r || generateSpinR(),
		__spin_b: hidden.__spin_b || "trunk",
		__spin_t: hidden.__spin_t || generateSpinT(),
		__jssesw: hidden.__jssesw || "1",
		_fb_noscript: "true"
	};
}

function build2FAPayload(code, html) {
	const hidden = extractAllHiddenInputs(html);
	const lsd = hidden.lsd || generateLSD();
	return {
		approvals_code: code,
		name_action_selected: "dont_save",
		lsd,
		jazoest: hidden.jazoest || generateJazoest(lsd),
		nh: hidden.nh || "",
		fb_dtsg: hidden.fb_dtsg || generateFbDtsg(),
		__a: hidden.__a || "1",
		__user: hidden.__user || "0",
		__req: hidden.__req || "2",
		__rev: hidden.__rev || generateRev(),
		__spin_r: hidden.__spin_r || generateSpinR(),
		__spin_b: hidden.__spin_b || "trunk",
		__spin_t: hidden.__spin_t || generateSpinT(),
		submit: "Continue",
		_fb_noscript: "true"
	};
}

function buildSaveDevicePayload(html) {
	const hidden = extractAllHiddenInputs(html);
	const lsd = hidden.lsd || generateLSD();
	return {
		name_action_selected: "dont_save",
		lsd,
		jazoest: hidden.jazoest || generateJazoest(lsd),
		nh: hidden.nh || "",
		fb_dtsg: hidden.fb_dtsg || generateFbDtsg(),
		__a: hidden.__a || "1",
		__user: hidden.__user || "0",
		__req: hidden.__req || "3",
		__rev: hidden.__rev || generateRev(),
		__spin_r: hidden.__spin_r || generateSpinR(),
		__spin_b: hidden.__spin_b || "trunk",
		__spin_t: hidden.__spin_t || generateSpinT(),
		submit: "Continue",
		_fb_noscript: "true"
	};
}

function createClient(proxy) {
	let httpsAgent;
	if (proxy) {
		if (proxy.startsWith("socks") && SocksProxyAgent) {
			httpsAgent = new SocksProxyAgent(proxy);
		} else if (HttpsProxyAgent) {
			httpsAgent = new HttpsProxyAgent(proxy);
		} else {
			httpsAgent = new https.Agent({ keepAlive: true, timeout: TIMEOUTS.REQUEST });
		}
	} else {
		httpsAgent = new https.Agent({ keepAlive: true, timeout: TIMEOUTS.REQUEST });
	}

	return axios.create({
		timeout: TIMEOUTS.REQUEST,
		maxRedirects: 0,
		validateStatus: s => s < 400,
		httpsAgent,
		decompress: true
	});
}

class SessionManager {
	constructor() {
		this.timers = [];
	}

	start(getFn) {
		this.stop();
		this.timers.push(setInterval(async () => {
			try { await getFn(`${ENDPOINTS.MBASIC}/settings`, `${ENDPOINTS.MBASIC}/`); } catch (_) {}
		}, TIMEOUTS.SESSION_REFRESH));
		this.timers.push(setInterval(async () => {
			try { await getFn(`${ENDPOINTS.MBASIC}/`, `${ENDPOINTS.MBASIC}/`); } catch (_) {}
		}, TIMEOUTS.PRESENCE));
	}

	stop() {
		for (const t of this.timers) clearInterval(t);
		this.timers = [];
	}
}

const globalSession = new SessionManager();

function makeHttpHelpers(client, cookies, ua) {
	function buildGETHeaders(referer, extra = {}) {
		return {
			"Host": "mbasic.facebook.com",
			"User-Agent": ua,
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
			"Accept-Language": randomLang(),
			"Accept-Encoding": "gzip, deflate, br",
			"Cache-Control": "max-age=0",
			"Pragma": "no-cache",
			"Upgrade-Insecure-Requests": "1",
			"Sec-Fetch-Dest": "document",
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": referer ? "same-origin" : "none",
			"Sec-Fetch-User": "?1",
			"Sec-Ch-Ua": '"Chromium";v="125", "Not.A/Brand";v="24"',
			"Sec-Ch-Ua-Mobile": "?1",
			"Sec-Ch-Ua-Platform": '"Android"',
			"Referer": referer || ENDPOINTS.MBASIC + "/",
			"Origin": referer ? new URL(referer).origin : ENDPOINTS.MBASIC,
			"Cookie": cookieObjToHeader(cookies),
			"Connection": "keep-alive",
			...extra
		};
	}

	function buildPOSTHeaders(referer, extra = {}) {
		return {
			"Host": "mbasic.facebook.com",
			"User-Agent": ua,
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
			"Accept-Language": randomLang(),
			"Accept-Encoding": "gzip, deflate, br",
			"Content-Type": "application/x-www-form-urlencoded",
			"Cache-Control": "max-age=0",
			"Pragma": "no-cache",
			"Upgrade-Insecure-Requests": "1",
			"Sec-Fetch-Dest": "document",
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "same-origin",
			"Sec-Fetch-User": "?1",
			"Sec-Ch-Ua": '"Chromium";v="125", "Not.A/Brand";v="24"',
			"Sec-Ch-Ua-Mobile": "?1",
			"Sec-Ch-Ua-Platform": '"Android"',
			"Referer": referer || ENDPOINTS.MBASIC + "/login/",
			"Origin": ENDPOINTS.MBASIC,
			"Cookie": cookieObjToHeader(cookies),
			"Connection": "keep-alive",
			...extra
		};
	}

	async function requestOnce(method, url, body, referer, extra) {
		const headers = method === "POST"
			? buildPOSTHeaders(referer, extra)
			: buildGETHeaders(referer, extra);

		const cfg = { method, url, headers };
		if (body) cfg.data = typeof body === "string" ? body : new URLSearchParams(body).toString();
		const res = await client.request(cfg);
		parseCookieHeader(res.headers["set-cookie"], cookies);
		return res;
	}

	async function get(url, referer, _depth = 0) {
		if (_depth > 6) return { html: "", url, status: 0, ok: false };
		try {
			const res = await requestOnce("GET", url, null, referer);
			const location = res.headers["location"];
			if (location && res.status >= 300 && res.status < 400) {
				const next = location.startsWith("http") ? location : ENDPOINTS.MBASIC + location;
				await sleep(rand(TIMEOUTS.MIN_DELAY, TIMEOUTS.MAX_DELAY));
				return get(next, url, _depth + 1);
			}
			return { html: res.data || "", url: res.config.url || url, status: res.status, ok: true, headers: res.headers };
		} catch (err) {
			log("warn", `GET ${url} failed: ${err.message}`);
			return { html: "", url, status: 0, ok: false };
		}
	}

	async function post(url, form, referer, _depth = 0) {
		if (_depth > 6) return { html: "", url, status: 0, ok: false };
		try {
			const res = await requestOnce("POST", url, form, referer);
			const location = res.headers["location"];
			if (location && res.status >= 300 && res.status < 400) {
				const next = location.startsWith("http") ? location : ENDPOINTS.MBASIC + location;
				await sleep(rand(TIMEOUTS.MIN_DELAY, TIMEOUTS.MAX_DELAY));
				if (res.status === 307 || res.status === 308) return post(next, form, url, _depth + 1);
				return get(next, url, _depth + 1);
			}
			return { html: res.data || "", url: res.config.url || url, status: res.status, ok: true, headers: res.headers };
		} catch (err) {
			log("warn", `POST ${url} failed: ${err.message}`);
			return { html: "", url, status: 0, ok: false };
		}
	}

	return { get, post };
}

function saveAccountFile(appState) {
	try {
		fs.writeFileSync(path.join(process.cwd(), "account.txt"), JSON.stringify(appState, null, 2), "utf8");
		log("info", "Saved cookies to account.txt");
	} catch (_) {
		log("warn", "Could not write account.txt");
	}
}

async function loginWithAppState(appState, userAgent, proxy) {
	log("info", "Attempting login via AppState...");
	const ua = userAgent || randomUA();
	const cookies = {};

	for (const c of normalizeAppState(appState)) {
		if (c.key && c.value) cookies[c.key] = c.value;
	}

	const missing = REQUIRED_COOKIES.filter(k => !cookies[k]);
	if (missing.length > 0) {
		log("error", `AppState missing cookies: ${missing.join(", ")}`);
		return null;
	}

	const client = createClient(proxy);
	const { get } = makeHttpHelpers(client, cookies, ua);

	await sleep(rand(600, 1400));
	const { html, ok } = await get(`${ENDPOINTS.MBASIC}/settings`, null);

	if (!ok || !isLoggedIn(html, cookies)) {
		log("error", "AppState rejected by Facebook");
		return null;
	}

	const jar = cookieObjToJar(cookies);
	saveAccountFile(jar);
	globalSession.start(get);
	log("info", "Login successful via AppState");
	return jar;
}

async function loginWithCredentials({ email, pass, twoFactorSecretOrCode, userAgent, proxy } = {}) {
	if (!email || !pass) {
		log("error", "Email and password required");
		return null;
	}

	log("info", `Attempting credentials login for ${email}`);
	const ua = userAgent || randomUA();
	const cookies = {};
	const client = createClient(proxy);
	const { get, post } = makeHttpHelpers(client, cookies, ua);

	await sleep(rand(600, 1400));
	let res = await get(`${ENDPOINTS.MBASIC}/settings`, null);

	if (res.ok && isLoggedIn(res.html, cookies)) {
		const jar = cookieObjToJar(cookies);
		saveAccountFile(jar);
		globalSession.start(get);
		log("info", "Existing valid session detected");
		return jar;
	}

	let loginPage = null;
	for (const p of LOGIN_PATHS) {
		const r = await get(`${ENDPOINTS.MBASIC}${p}`, null);
		if (r.ok && r.html && r.html.includes("<form") && (r.html.includes("login") || r.html.includes("email"))) {
			loginPage = r;
			break;
		}
		await sleep(rand(400, 900));
	}

	if (!loginPage) {
		log("error", "Could not load Facebook login page");
		return null;
	}

	if (hasSuspend(loginPage.html, loginPage.url)) {
		log("error", "Account is suspended/disabled");
		return null;
	}
	if (hasCheckpoint(loginPage.html, loginPage.url)) {
		log("error", "Account requires checkpoint verification");
		return null;
	}

	const loginAction = extractAction(loginPage.html, `${ENDPOINTS.MBASIC}/login/device-based/regular/login/`);

	log("info", "Submitting login credentials...");
	await sleep(rand(1200, 2800));

	const loginPayload = buildLoginPayload(email, pass, loginPage.html);

	res = await post(loginAction, loginPayload, `${ENDPOINTS.MBASIC}/login/`);

	if (isWrongPassword(res.html)) {
		log("error", "Incorrect email/password");
		return null;
	}
	if (hasSuspend(res.html, res.url)) {
		log("error", "Account is suspended/disabled");
		return null;
	}
	if (hasCheckpoint(res.html, res.url)) {
		log("error", "Account requires checkpoint verification");
		return null;
	}

	if (has2FA(res.html, res.url)) {
		log("info", "Two-factor authentication required");

		if (!twoFactorSecretOrCode) {
			log("error", "2FA code/secret not provided");
			return null;
		}

		let code2FA = String(twoFactorSecretOrCode).trim();
		const normalized = code2FANorm(code2FA);

		if (!/^\d{6,8}$/.test(normalized)) {
			if (toptp) {
				try {
					const t = toptp(normalized, { digits: 6, period: 30, algorithm: "SHA-1" });
					code2FA = String(t);
					log("info", "Generated TOTP code from secret");
				} catch (e) {
					log("warn", "TOTP generation failed, using provided value");
				}
			} else {
				log("warn", "totp-generator not installed; using provided value");
			}
		}

		const tfaAction = extractAction(res.html, `${ENDPOINTS.MBASIC}/login/two_step_verification/`);
		const tfaPayload = build2FAPayload(code2FA, res.html);

		await sleep(rand(800, 1800));
		res = await post(tfaAction, tfaPayload, res.url);

		if (has2FA(res.html, res.url)) {
			log("error", "2FA code rejected");
			return null;
		}
		if (hasCheckpoint(res.html, res.url) || hasSuspend(res.html, res.url)) {
			log("error", "Facebook blocked the 2FA flow");
			return null;
		}
	}

	if (hasSaveDevice(res.html)) {
		log("info", "Handling save-device prompt...");
		const saveAction = extractAction(res.html, `${ENDPOINTS.MBASIC}/login/save-device/`);
		const savePayload = buildSaveDevicePayload(res.html);
		await sleep(rand(500, 1200));
		res = await post(saveAction, savePayload, res.url);
	}

	if (!isLoggedIn(res.html, cookies)) {
		await sleep(rand(600, 1200));
		const check = await get(`${ENDPOINTS.MBASIC}/settings`, res.url);
		if (!check.ok || !isLoggedIn(check.html, cookies)) {
			log("error", "Facebook did not create a valid session");
			return null;
		}
	}

	const miss = REQUIRED_COOKIES.filter(k => !cookies[k]);
	if (miss.length > 0) {
		log("error", `Missing required cookies: ${miss.join(", ")}`);
		return null;
	}

	const jar = cookieObjToJar(cookies);
	saveAccountFile(jar);
	globalSession.start(get);
	log("info", `Login successful for ${email}`);
	return jar;
}

module.exports = async function loginMbasic(config = {}) {
	log("info", "Initializing login module...");

	const email = config.email;
	const pass = config.pass || config.password;
	const twoFA = config.twoFactorSecretOrCode || config.twoFactorCode || config["2FASecret"] || config.tfa;
	const hasCredentials = Boolean(email && pass);

	if (config.appState) {
		log("info", "Method 1: AppState");
		const s = await loginWithAppState(config.appState, config.userAgent, config.proxy);
		if (s) return s;
		if (hasCredentials) {
			log("info", "AppState failed, falling back to credentials");
			return await loginWithCredentials({
				email, pass,
				twoFactorSecretOrCode: twoFA,
				userAgent: config.userAgent,
				proxy: config.proxy
			});
		}
		return null;
	}

	if (hasCredentials) {
		log("info", "Method 2: Email/Password");
		return await loginWithCredentials({
			email, pass,
			twoFactorSecretOrCode: twoFA,
			userAgent: config.userAgent,
			proxy: config.proxy
		});
	}

	try {
		const accountFile = path.join(process.cwd(), "account.txt");
		if (fs.existsSync(accountFile)) {
			log("info", "Method 3: Saved account.txt");
			const saved = JSON.parse(fs.readFileSync(accountFile, "utf8"));
			if (saved && (Array.isArray(saved) || typeof saved === "object")) {
				const s = await loginWithAppState(saved, config.userAgent, config.proxy);
				if (s) return s;
			}
		}
	} catch (err) {
		log("warn", `Failed to load account.txt: ${err.message}`);
	}

	log("error", "No valid login credentials found!");
	log("error", "Provide email+password, appState, or account.txt");
	return null;
};

module.exports.loginWithAppState = loginWithAppState;
module.exports.loginWithCredentials = loginWithCredentials;
module.exports.buildLoginPayload = buildLoginPayload;
module.exports.build2FAPayload = build2FAPayload;
module.exports.buildSaveDevicePayload = buildSaveDevicePayload;
module.exports.stopSession = () => globalSession.stop();
