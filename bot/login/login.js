process.stdout.write('\x1b]2;X69X BOT V3 - Made by Azadx69x,\x1b\x5c');
const defaultRequire = require;

function decode(text) {
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'hex').toString('utf-8');
	text = Buffer.from(text, 'base64').toString('utf-8');
	return text;
}

const gradient = defaultRequire('gradient-string');
const axios = defaultRequire('axios');
const path = defaultRequire('path');
const readline = defaultRequire('readline');
const fs = defaultRequire('fs-extra');
const toptp = defaultRequire('totp-generator');
const fcaLogger = defaultRequire('npmlog');
fcaLogger.level = process.env.FCA_VERBOSE_LOGS === 'true' ? 'info' : 'warn';
const { login } = require(`${process.cwd()}/fca-azadx69x`);
const qr = new (defaultRequire('qrcode-reader'));
const Canvas = defaultRequire('canvas');
const https = defaultRequire('https');

const axiosInstance = axios.create({
	timeout: 30000,
	httpsAgent: new https.Agent({
		keepAlive: true,
		keepAliveMsecs: 1000,
		maxSockets: 10,
		timeout: 30000
	})
});

async function getName(userID, api) {
	try {
		if (api && typeof api.getUserInfo === 'function') {
			const userInfo = await api.getUserInfo(userID);
			return userInfo[userID]?.name || null;
		}
		return null;
	}
	catch (error) {
		return null;
	}
}

function compareVersion(version1, version2) {
	const v1 = version1.split('.');
	const v2 = version2.split('.');
	for (let i = 0; i < 3; i++) {
		if (parseInt(v1[i]) > parseInt(v2[i])) {
				return 1;
		}
		if (parseInt(v1[i]) < parseInt(v2[i])) {
				return -1;
		}
	}
	return 0;
}

const { writeFileSync, readFileSync, existsSync, watch } = require('fs-extra');
const handlerWhenListenHasError = require('./handlerWhenListenHasError.js');
const checkLiveCookie = require('./checkLiveCookie.js');
const { callbackListenTime, storage5Message } = global.GoatBot;
const { log, logColor, getPrefix, createOraDots, jsonStringifyColor, getText, convertTime, colors, randomString } = global.utils;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let restartScheduled = false;

const currentVersion = require(`${process.cwd()}/package.json`).version;

function clearLifecycleTimers() {
	for (const key of [
		'intervalRestartListenMqtt',
		'cookieRefreshInterval',
		'cookieRefreshTimeout',
		'autoReconnectInterval',
		'memoryCleanupInterval',
		'timeOutUptime'
	]) {
		const timer = global[key];
		if (timer) {
			clearTimeout(timer);
			clearInterval(timer);
			delete global[key];
		}
	}
}

function scheduleBotRestart(loginWithEmail, delay) {
	if (restartScheduled) return;
	restartScheduled = true;
	setTimeout(() => {
		restartScheduled = false;
		startBot(loginWithEmail);
	}, delay);
}

function getListenErrorText(error) {
	if (typeof error == 'string') {
			return error.toLowerCase();
	}
	if (!error) {
			return '';
	}
	return [
		error.error,
		error.message,
		error.code,
		error.reason
	]
		.filter(value => value != null)
		.map(value => String(value))
		.join(' ')
		.toLowerCase();
}

function centerText(text, length) {
	const width = process.stdout.columns;
	const leftPadding = Math.floor((width - (length || text.length)) / 2);
	const rightPadding = width - leftPadding - (length || text.length);
	const paddedString = ' '.repeat(leftPadding > 0 ? leftPadding : 0) + text + ' '.repeat(rightPadding > 0 ? rightPadding : 0);
	console.log(paddedString);
}

const titles = [
	[
		'██╗░░██╗░█████╗░░█████╗░██╗░░██╗',
		'╚██╗██╔╝██╔═══╝░██╔══██╗╚██╗██╔╝',
		'░╚███╔╝░██████╗░╚██████║░╚███╔╝░',
		'░██╔██╗░██╔══██╗░╚═══██║░██╔██╗░',
		'██╔╝╚██╗╚█████╔╝░█████╔╝██╔╝╚██╗',
		'╚═╝░░╚═╝░╚════╝░░╚════╝░╚═╝░░╚═╝',
		'',
		'██████╗░░█████╗░████████╗  ██╗░░░██╗██████╗░',
		'██╔══██╗██╔══██╗╚══██╔══╝  ██║░░░██║╚════██╗',
		'██████╦╝██║░░██║░░░██║░░░  ╚██╗░██╔╝░█████╔╝',
		'██╔══██╗██║░░██║░░░██║░░░  ░╚████╔╝░░╚═══██╗',
		'██████╦╝╚█████╔╝░░░██║░░░  ░░╚██╔╝░░██████╔╝',
		'╚═════╝░░╚════╝░░░░╚═╝░░░  ░░░╚═╝░░░╚═════╝░'
	],
	[
		'X69X BOT V3'
	]
];

const title = titles[0];
const maxWidth = process.stdout.columns || 120;

console.log(gradient('#ff416c', '#ff4b2b')(createLine(null, true)));
console.log();
for (const text of title) {
	const textColor = gradient('#00b4db', '#0083b0')(text);
	centerText(textColor, text.length);
}
let subTitle = `X69X BOT V3@${currentVersion} -🚀`;
const subTitleArray = [];
if (subTitle.length > maxWidth) {
	while (subTitle.length > maxWidth) {
		let lastSpace = subTitle.slice(0, maxWidth).lastIndexOf(' ');
		lastSpace = lastSpace == -1 ? maxWidth : lastSpace;
		subTitleArray.push(subTitle.slice(0, lastSpace).trim());
		subTitle = subTitle.slice(lastSpace).trim();
	}
	subTitle ? subTitleArray.push(subTitle) : '';
}
else {
	subTitleArray.push(subTitle);
}
const author = ('Made by Azadx69x');
const srcUrl = ('Source code: https://github.com/azadx69x/X69X-BOT-V3');
const fakeRelease = ('ALL VERSIONS NOT RELEASED HERE ARE FAKE');

for (const t of subTitleArray) {
	const textColor2 = gradient('#9F98E8', '#AFF6CF')(t);
	centerText(textColor2, t.length);
}
centerText(gradient('#9F98E8', '#AFF6CF')(author), author.length);
centerText(gradient('#9F98E8', '#AFF6CF')(srcUrl), srcUrl.length);
centerText(gradient('#f5af19', '#f12711')(fakeRelease), fakeRelease.length);

let widthConsole = process.stdout.columns;
if (widthConsole > 50) {
		widthConsole = 50;
}
function createLine(content, isMaxWidth = false) {
	if (!content) {
		return Array(isMaxWidth ? process.stdout.columns : widthConsole).fill('─').join('');
	}
	else {
		content = ` ${content.trim()} `;
		const lengthContent = content.length;
		const lengthLine = isMaxWidth ? process.stdout.columns - lengthContent : widthConsole - lengthContent;
		let left = Math.floor(lengthLine / 2);
		if (left < 0 || isNaN(left)) {
			left = 0;
		}
		const lineOne = Array(left).fill('─').join('');
		return lineOne + content + lineOne;
	}
}

const character = createLine();

const clearLines = (n) => {
	for (let i = 0; i < n; i++) {
		const y = i === 0 ? null : -1;
		if (typeof process.stdout.moveCursor === 'function') process.stdout.moveCursor(0, y);
		if (typeof process.stdout.clearLine === 'function') process.stdout.clearLine(1);
	}
	if (typeof process.stdout.cursorTo === 'function') process.stdout.cursorTo(0);
	process.stdout.write('');
};

async function input(prompt, isPassword = false) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	if (isPassword) {
		rl.input.on('keypress', function () {
			const len = rl.line.length;
			readline.moveCursor(rl.output, -len, 0);
			readline.clearLine(rl.output, 1);
			for (let i = 0; i < len; i++) {
				rl.output.write('*');
			}
		});
	}

	return new Promise(resolve => rl.question(prompt, ans => {
		rl.close();
		resolve(ans);
	}));
}

qr.readQrCode = async function (filePath) {
	const image = await Canvas.loadImage(filePath);
	const canvas = Canvas.createCanvas(image.width, image.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	const data = ctx.getImageData(0, 0, image.width, image.height);
	let value;
	qr.callback = function (error, result) {
		if (error) {
				throw error;
		}
		value = result;
	};
	qr.decode(data);
	return value.result;
};

const { dirAccount } = global.client;
const { facebookAccount } = global.GoatBot.config;

function responseUptimeSuccess(req, res) {
	res.type('json').send({
		status: 'success',
		uptime: process.uptime(),
		unit: 'seconds'
	});
}

function responseUptimeError(req, res) {
	res.status(500).type('json').send({
		status: 'error',
		uptime: process.uptime(),
		statusAccountBot: global.statusAccountBot
	});
}

function checkAndTrimString(string) {
	if (typeof string == 'string') {
			return string.trim();
	}
	return string;
}

function filterKeysAppState(appState) {
	return appState.filter(item => ['c_user', 'xs', 'datr', 'fr', 'sb', 'i_user'].includes(item.key));
}

global.responseUptimeCurrent = responseUptimeSuccess;
global.responseUptimeSuccess = responseUptimeSuccess;
global.responseUptimeError = responseUptimeError;

global.statusAccountBot = 'good';
let changeFbStateByCode = false;
let latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;

async function getAppStateFromEmail(spin = { _start: () => { }, _stop: () => { } }, facebookAccount) {
	const { email, password, userAgent, proxy } = facebookAccount;
	const getFbstate = require(process.env.NODE_ENV === 'development' ? './getFbstate1.dev.js' : './getFbstate1.js');
	let code2FATemp;
	let appState;
	try {
		try {
			appState = await getFbstate(checkAndTrimString(email), checkAndTrimString(password), userAgent, proxy);
			spin._stop();
		}
		catch (err) {
			if (err.continue) {
				let tryNumber = 0;
				let isExit = false;

				await (async function submitCode(message) {
					if (message && isExit) {
						spin._stop();
						log.error('LOGIN FACEBOOK', message);
						process.exit();
					}

					if (message) {
						spin._stop();
						log.warn('LOGIN FACEBOOK', message);
					}

					if (facebookAccount['2FASecret'] && tryNumber == 0) {
						switch (['.png', '.jpg', '.jpeg'].some(i => facebookAccount['2FASecret'].endsWith(i))) {
							case true:
								code2FATemp = (await qr.readQrCode(`${process.cwd()}/${facebookAccount["2FASecret"]}`)).replace(/.*secret=(.*)&digits.*/g, '$1');
								break;
							case false:
								code2FATemp = facebookAccount['2FASecret'];
								break;
						}
					}
					else {
						spin._stop();
						code2FATemp = await input('> Enter 2FA code or secret: ');
						readline.moveCursor(process.stderr, 0, -1);
						readline.clearScreenDown(process.stderr);
					}

					const code2FA = isNaN(code2FATemp) ?
						toptp(
							code2FATemp.normalize('NFD')
								.toLowerCase()
								.replace(/[\u0300-\u036f]/g, '')
								.replace(/[đ|Đ]/g, (x) => x == 'đ' ? 'd' : 'D')
								.replace(/\(|\)|\,/g, '')
								.replace(/ /g, '')
						) :
						code2FATemp;
					spin._start();
					try {
						appState = JSON.parse(JSON.stringify(await err.continue(code2FA)));
						appState = appState.map(item => ({
							key: item.key,
							value: item.value,
							domain: item.domain,
							path: item.path,
							hostOnly: item.hostOnly,
							creation: item.creation,
							lastAccessed: item.lastAccessed
						})).filter(item => item.key);
						spin._stop();
					}
					catch (err) {
						tryNumber++;
						if (!err.continue) {
								isExit = true;
						}
						await submitCode(err.message);
					}
				})(err.message);
			}
			else {
					throw err;
			}
		}
	}
	catch (err) {
		const loginMbasic = require(process.env.NODE_ENV === 'development' ? './loginMbasic.dev.js' : './loginMbasic.js');
		if (facebookAccount['2FASecret']) {
			switch (['.png', '.jpg', '.jpeg'].some(i => facebookAccount['2FASecret'].endsWith(i))) {
				case true:
					code2FATemp = (await qr.readQrCode(`${process.cwd()}/${facebookAccount["2FASecret"]}`)).replace(/.*secret=(.*)&digits.*/g, '$1');
					break;
				case false:
					code2FATemp = facebookAccount['2FASecret'];
					break;
			}
		}

		appState = await loginMbasic({
			email,
			pass: password,
			twoFactorSecretOrCode: code2FATemp,
			userAgent,
			proxy
		});

		if (!Array.isArray(appState) || appState.length === 0) {
			const loginError = new Error('Facebook email/password login did not return a valid session');
			loginError.name = 'LOGIN_CREDENTIALS_ERROR';
			throw loginError;
		}

		appState = appState.map(item => {
			item.key = item.key || item.name;
			delete item.name;
			return item;
		});
		appState = filterKeysAppState(appState);
	}

	global.GoatBot.config.facebookAccount['2FASecret'] = code2FATemp || '';
	return appState;
}

function isNetScapeCookie(cookie) {
	if (typeof cookie !== 'string') {
			return false;
	}
	return /(.+)\t(1|TRUE|true)\t([\w\/.-]*)\t(1|TRUE|true)\t\d+\t([\w-]+)\t(.+)/i.test(cookie);
}

function netScapeToCookies(cookieData) {
	const cookies = [];
	const lines = cookieData.split('\n');
	lines.forEach((line) => {
		if (line.trim().startsWith('#')) {
			return;
		}
		const fields = line.split('\t').map((field) => field.trim()).filter((field) => field.length > 0);
		if (fields.length < 7) {
			return;
		}
		const cookie = {
			key: fields[5],
			value: fields[6],
			domain: fields[0],
			path: fields[2],
			hostOnly: fields[1] === 'TRUE',
			creation: new Date(fields[4] * 1000).toISOString(),
			lastAccessed: new Date().toISOString()
		};
		cookies.push(cookie);
	});
	return cookies;
}

function pushI_user(appState, value) {
	appState.push({
		key: 'i_user',
		value: value || facebookAccount.i_user,
		domain: 'facebook.com',
		path: '/',
		hostOnly: false,
		creation: new Date().toISOString(),
		lastAccessed: new Date().toISOString()
	});
	return appState;
}

let spin;
let facebookCheckpointBlocked = false;

function isFacebookCheckpointError(error) {
	return /checkpoint|automated behavior|automated behaviour|checkpoint verification|error retrieving userid/.test(getListenErrorText(error));
}

async function getAppStateToLogin(loginWithEmail) {
	let appState = [];
	if (loginWithEmail) {
		try {
			return await getAppStateFromEmail(undefined, facebookAccount) || [];
		}
		catch (err) {
			log.err('LOGIN FACEBOOK', getText('login', 'loginPasswordError'), err.message);
			return [];
		}
	}
	const environmentAccount = process.env.FACEBOOK_APPSTATE || process.env.FACEBOOK_COOKIE;
	if (!environmentAccount && !existsSync(dirAccount)) {
			return log.error('LOGIN FACEBOOK', getText('login', 'notFoundDirAccount', colors.green(dirAccount)));
	}
	let accountText = environmentAccount || readFileSync(dirAccount, 'utf8');
	if (environmentAccount) {
			log.info('LOGIN FACEBOOK', 'Using Facebook session from environment secret');
	}
	const _trimmed = accountText.trim();
	const _isEmpty = !_trimmed || _trimmed === '[]' || _trimmed === '{}';
	if (_isEmpty) {
		const dirAccount2 = path.join(process.cwd(), 'account2.txt');
		if (existsSync(dirAccount2)) {
			const backup = readFileSync(dirAccount2, 'utf8').trim();
			if (backup) {
				log.warn('BACKUP ACCOUNT', '[STARTUP] account.txt is empty — loading from account2.txt and swapping files.');
				writeFileSync(dirAccount, backup);
				writeFileSync(dirAccount2, '');
				accountText = backup;
				log.info('BACKUP ACCOUNT', '[STARTUP] account2.txt loaded into account.txt successfully. Bot will login with backup account.');
			} else {
				log.err('BACKUP ACCOUNT', '[STARTUP] account.txt AND account2.txt are both empty — cannot login.');
			}
		} else {
			log.err('BACKUP ACCOUNT', '[STARTUP] account.txt is empty and account2.txt does not exist — cannot login.');
		}
	}

	try {
		const splitAccountText = accountText.replace(/\|/g, '\n').split('\n').map(i => i.trim()).filter(i => i);
		if (accountText.startsWith('EAAAA')) {
			try {
				spin = createOraDots(getText('login', 'loginToken'));
				spin._start();
				appState = await require('./getFbstate.js')(accountText);
			}
			catch (err) {
				err.name = 'TOKEN_ERROR';
				throw err;
			}
		}
		else {
			if (accountText.match(/^(?:\s*\w+\s*=\s*[^;]*;?)+/)) {
				spin = createOraDots(getText('login', 'loginCookieString'));
				spin._start();
				appState = accountText.split(';')
					.map(i => {
						const separator = i.indexOf('=');
						if (separator === -1) {
								return null;
						}
						return {
							key: i.slice(0, separator).trim(),
							value: i.slice(separator + 1).trim(),
							domain: 'facebook.com',
							path: '/',
							hostOnly: true,
							creation: new Date().toISOString(),
							lastAccessed: new Date().toISOString()
						};
					})
					.filter(i => i && i.key && i.value && i.key != 'x-referer');
			}
			else if (isNetScapeCookie(accountText)) {
				spin = createOraDots(getText('login', 'loginCookieNetscape'));
				spin._start();
				appState = netScapeToCookies(accountText);
			}
			else if (
				(splitAccountText.length == 2 || splitAccountText.length == 3) &&
				!splitAccountText.slice(0, 2).map(i => i.trim()).some(i => i.includes(' '))
			) {
				global.GoatBot.config.facebookAccount.email = splitAccountText[0];
				global.GoatBot.config.facebookAccount.password = splitAccountText[1];
				if (splitAccountText[2]) {
					const code2FATemp = splitAccountText[2].replace(/ /g, '');
					global.GoatBot.config.facebookAccount['2FASecret'] = code2FATemp;
				}
				writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			}
			else {
				try {
					spin = createOraDots(getText('login', 'loginCookieArray'));
					spin._start();
					appState = JSON.parse(accountText);
				}
				catch (err) {
					const error = new Error(`${path.basename(dirAccount)} is invalid`);
					error.name = 'ACCOUNT_ERROR';
					throw error;
				}
				if (appState.some(i => i.name)) {
					appState = appState.map(i => {
						i.key = i.name;
						delete i.name;
						return i;
					});
				}
				else if (!appState.some(i => i.key)) {
					const error = new Error(`${path.basename(dirAccount)} is invalid`);
					error.name = 'ACCOUNT_ERROR';
					throw error;
				}
				appState = appState
					.map(item => ({
						...item,
						domain: 'facebook.com',
						path: '/',
						hostOnly: false,
						creation: new Date().toISOString(),
						lastAccessed: new Date().toISOString()
					}))
					.filter(i => i.key && i.value && i.key != 'x-referer');
			}
		}
	}
	catch (err) {
		spin && spin._stop();
		let {
			email,
			password
		} = facebookAccount;
		if (err.name === 'TOKEN_ERROR') {
			log.err('LOGIN FACEBOOK', getText('login', 'tokenError', colors.green('EAAAA...'), colors.green(dirAccount)));
		}
		else if (err.name === 'COOKIE_INVALID') {
			log.err('LOGIN FACEBOOK', getText('login', 'cookieError'));
		}

		if (!email || !password) {
			log.warn('LOGIN FACEBOOK', getText('login', 'cannotFindAccount'));
			if (!process.stdin.isTTY || process.env.REPLIT_DEV_DOMAIN || process.env.REPL_ID || process.env.CI) {
				log.warn('LOGIN FACEBOOK', 'No interactive terminal detected. Start the dashboard and add a valid Facebook session from the web UI.');
				return [];
			}
			const rl = readline.createInterface({
				input: process.stdin,
				output: process.stdout
			});
			const options = [
				getText('login', 'chooseAccount'),
				getText('login', 'chooseToken'),
				getText('login', 'chooseCookieString'),
				getText('login', 'chooseCookieArray')
			];
			let currentOption = 0;
			await new Promise((resolve) => {
				const character = '>';
				function showOptions() {
					rl.output.write(`\r${options.map((option, index) => index === currentOption ? colors.blueBright(`${character} (${index + 1}) ${option}`) : `  (${index + 1}) ${option}`).join('\n')}\u001B`);
					rl.write('\u001B[?25l');
				}
				rl.input.on('keypress', (_, key) => {
					if (key.name === 'up') {
						currentOption = (currentOption - 1 + options.length) % options.length;
					}
					else if (key.name === 'down') {
						currentOption = (currentOption + 1) % options.length;
					}
					else if (!isNaN(key.name)) {
						const number = parseInt(key.name);
						if (number >= 0 && number <= options.length) {
								currentOption = number - 1;
						}
						process.stdout.write('\033[1D');
					}
					else if (key.name === 'enter' || key.name === 'return') {
						rl.input.removeAllListeners('keypress');
						rl.close();
						clearLines(options.length + 1);
						showOptions();
						resolve();
					}
					else {
						process.stdout.write('\033[1D');
					}

					clearLines(options.length);
					showOptions();
				});
				showOptions();
			});

			rl.write('\u001B[?25h\n');
			clearLines(options.length + 1);
			log.info('LOGIN FACEBOOK', getText('login', 'loginWith', options[currentOption]));

			if (currentOption == 0) {
				email = await input(`${getText('login', 'inputEmail')} `);
				password = await input(`${getText('login', 'inputPassword')} `, true);
				const twoFactorAuth = await input(`${getText('login', 'input2FA')} `);
				facebookAccount.email = email || '';
				facebookAccount.password = password || '';
				facebookAccount['2FASecret'] = twoFactorAuth || '';
			}
			else if (currentOption == 1) {
				const token = await input(getText('login', 'inputToken') + ' ');
				writeFileSync(global.client.dirAccount, token);
			}
			else if (currentOption == 2) {
				const cookie = await input(getText('login', 'inputCookieString') + ' ');
				writeFileSync(global.client.dirAccount, cookie);
			}
			else {
				const cookie = await input(getText('login', 'inputCookieArray') + ' ');
				writeFileSync(global.client.dirAccount, JSON.stringify(JSON.parse(cookie), null, 2));
			}
			return await getAppStateToLogin();
		}

		log.info('LOGIN FACEBOOK', getText('login', 'loginPassword'));
		log.info("ACCOUNT INFO", `Email: ${facebookAccount.email}, I_User: ${facebookAccount.i_user || "(empty)"}`);
		spin = createOraDots(getText('login', 'loginPassword'));
		spin._start();

		try {
			appState = await getAppStateFromEmail(spin, facebookAccount);
			spin._stop();
		}
		catch (err) {
			spin._stop();
			if (isFacebookCheckpointError(err)) {
					facebookCheckpointBlocked = true;
			}
			log.err('LOGIN FACEBOOK', getText('login', 'loginError'), err.message, err);
			return [];
		}
	}
	return appState;
}

function stopListening(keyListen) {
	keyListen = keyListen || Object.keys(callbackListenTime).pop();
	return new Promise((resolve) => {
		global.GoatBot.fcaApi.stopListening?.(() => {
			if (callbackListenTime[keyListen]) {
				callbackListenTime[keyListen] = () => { };
			}
			resolve();
		}) || resolve();
	});
}

async function safeGetUserName(userID, api, usersData = null) {

	if (usersData && usersData.getName && typeof usersData.getName === 'function') {
		try {
			const name = await usersData.getName(userID);
			if (name && name !== `User_${userID}`) {
				return name;
			}
		} catch (error) {

		}
	}


	if (api && typeof api.getUserInfo === 'function') {
		try {
			const userInfo = await api.getUserInfo(userID);
			const name = userInfo?.[userID]?.name;
			if (name) {
				return name;
			}
		} catch (error) {

		}
	}


	try {
		const name = await getName(userID, api);
		if (name) {
			return name;
		}
	} catch (error) {

	}


	return `User_${userID}`;
}

async function startBot(loginWithEmail) {
	clearLifecycleTimers();
	console.log(colors.hex('#f5ab00')(createLine('START LOGGING IN', true)));
	const currentVersion = require('../../package.json').version;


	let tooOldVersion = '0.0.0';
	try {
		const response = await axiosInstance.get('https://raw.githubusercontent.com/azadx69x/X69X-BOT-V3-Storage-/main/tooOldVersions.txt', {
			timeout: 10000
		});
		tooOldVersion = response.data || '0.0.0';
	} catch (error) {
		console.warn('Cannot get latest version info:', error.message);
	}

	if (compareVersion(currentVersion, tooOldVersion) === -1) {
		log.err('VERSION', getText('version', 'tooOldVersion', colors.yellowBright('node update')));
		process.exit();
	}

	if (global.GoatBot.Listening) {
			await stopListening();
	}
	log.info('LOGIN FACEBOOK', getText('login', 'currentlyLogged'));

	let appState = await getAppStateToLogin(loginWithEmail);
	if (!Array.isArray(appState) || appState.length === 0) {
		global.statusAccountBot = "can't login";
		if (facebookCheckpointBlocked) {
			log.err('FACEBOOK CHECKPOINT', 'Facebook blocked this session with a checkpoint. Complete the review in a normal browser; automatic relogin is paused.');
			return;
		}
		log.err('LOGIN FACEBOOK', 'No valid Facebook session was returned from cookie or email/password login');
		process.exit(1);
	}
	changeFbStateByCode = true;
	appState = filterKeysAppState(appState);
	writeFileSync(dirAccount, JSON.stringify(appState, null, 2));
	setTimeout(() => changeFbStateByCode = false, 1000);

	(function loginBot(appState) {
		global.GoatBot.commands = new Map();
		global.GoatBot.eventCommands = new Map();
		global.GoatBot.aliases = new Map();
		global.GoatBot.onChat = [];
		global.GoatBot.onEvent = [];
		global.GoatBot.onReply = new Map();
		global.GoatBot.onReaction = new Map();
		clearInterval(global.intervalRestartListenMqtt);
		delete global.intervalRestartListenMqtt;

		if (facebookAccount.i_user) {
				pushI_user(appState, facebookAccount.i_user);
		}
		let isSendNotiErrorMessage = false;

		login({ appState }, global.GoatBot.config.optionsFca, async function (error, api) {
			if (!isNaN(facebookAccount.intervalGetNewCookie) && facebookAccount.intervalGetNewCookie > 0) {
				if (facebookAccount.email && facebookAccount.password) {
					spin?._stop();
					log.info('REFRESH COOKIE', getText('login', 'refreshCookieAfter', convertTime(facebookAccount.intervalGetNewCookie * 60 * 1000, true)));
						global.cookieRefreshTimeout = setTimeout(async function refreshCookie() {
						try {
							log.info('REFRESH COOKIE', getText('login', 'refreshCookie'));
							const appState = await getAppStateFromEmail(undefined, facebookAccount);
							if (facebookAccount.i_user) {
									pushI_user(appState, facebookAccount.i_user);
							}
							changeFbStateByCode = true;
							writeFileSync(dirAccount, JSON.stringify(filterKeysAppState(appState), null, 2));
							setTimeout(() => changeFbStateByCode = false, 1000);
							log.info('REFRESH COOKIE', getText('login', 'refreshCookieSuccess'));
								return startBot(false);
						}
						catch (err) {
							log.err('REFRESH COOKIE', getText('login', 'refreshCookieError'), err.message, err);
								global.cookieRefreshTimeout = setTimeout(refreshCookie, facebookAccount.intervalGetNewCookie * 60 * 1000);
						}
					}, facebookAccount.intervalGetNewCookie * 60 * 1000);
				}
				else {
					spin?._stop();
					log.warn('REFRESH COOKIE', getText('login', 'refreshCookieWarning'));
				}
			}
			spin ? spin._stop() : null;


			if (error) {
				if (isFacebookCheckpointError(error)) {
					facebookCheckpointBlocked = true;
					log.err('FACEBOOK CHECKPOINT', 'Facebook blocked this session with a checkpoint. Complete the review in a normal browser; automatic relogin is paused.', error);
					return;
				}
				log.err('LOGIN FACEBOOK', getText('login', 'loginError'), error);
				global.statusAccountBot = 'can\'t login';
				if (facebookAccount.email && facebookAccount.password) {
						return scheduleBotRestart(true, 5000);
				}
				process.exit();
			}

			global.GoatBot.fcaApi = api;
			global.GoatBot.botID = api.getCurrentUserID();


			console.log(gradient('#00d2ff', '#3a7bd5')(createLine('✓ LOGIN SUCCESSFUL ✓', true)));

			log.info('LOGIN FACEBOOK', getText('login', 'loginSuccess'));
			let hasBanned = false;
			global.botID = api.getCurrentUserID();
			logColor('#f5ab00', createLine('BOT INFO'));
			log.info('NODE VERSION', process.version);
			log.info('PROJECT VERSION', currentVersion);


			const botName = await safeGetUserName(global.botID, api);
			log.info("BOT ID", `${global.botID} - ${botName}`);

			log.info('PREFIX', global.GoatBot.config.prefix);
			log.info('LANGUAGE', global.GoatBot.config.language);
			log.info('BOT NICK NAME', global.GoatBot.config.nickNameBot || 'X69X BOT V3');
			log.info('MAINTAINER', 'Azadx69x');


			let dataGban = {};
			try {
				const item = await axiosInstance.get('https://raw.githubusercontent.com/Savage-Army/gban/refs/heads/main/gban.json', {
					timeout: 10000
				});
				dataGban = item.data;

				const botID = api.getCurrentUserID();
				if (dataGban.hasOwnProperty(botID)) {
					if (!dataGban[botID].toDate) {
						log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date));
						hasBanned = true;
					}
					else {
						let currentDate = Date.now();
						try {
							const timeResponse = await axiosInstance.get('http://worldtimeapi.org/api/timezone/UTC', {
								timeout: 5000
							});
							currentDate = (new Date(timeResponse.data.utc_datetime)).getTime();
						} catch (timeError) {
							console.warn('Cannot get world time:', timeError.message);
						}

						if (currentDate < (new Date(dataGban[botID].date)).getTime()) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[botID].date, dataGban[botID].reason, dataGban[botID].date, dataGban[botID].toDate));
							hasBanned = true;
						}
					}
				}

				for (const idad of global.GoatBot.config.adminBot) {
					if (dataGban.hasOwnProperty(idad)) {
						if (!dataGban[idad].toDate) {
							log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date));
							hasBanned = true;
						}
						else {
							let currentDate = Date.now();
							try {
								const timeResponse = await axiosInstance.get('http://worldtimeapi.org/api/timezone/UTC', {
									timeout: 5000
								});
								currentDate = (new Date(timeResponse.data.utc_datetime)).getTime();
							} catch (timeError) {
								console.warn('Cannot get world time:', timeError.message);
							}

							if (currentDate < (new Date(dataGban[idad].date)).getTime()) {
								log.err('GBAN', getText('login', 'gbanMessage', dataGban[idad].date, dataGban[idad].reason, dataGban[idad].date, dataGban[idad].toDate));
								hasBanned = true;
							}
						}
					}
				}
				if (hasBanned == true) {
						process.exit();
				}
			}
			catch (e) {
				console.log('GBAN check error:', e.message);
				log.err('GBAN', getText('login', 'checkGbanError'));
			}


			console.log(gradient('#ff0080', '#ff8c00')(createLine('ANTI-LOGOUT PROTECTION ENABLED', true)));


			if (global.GoatBot.config.autoRefreshFbstate == true) {
				changeFbStateByCode = true;
				try {
					writeFileSync(dirAccount, JSON.stringify(filterKeysAppState(api.getAppState()), null, 2));
					log.info('✓ ANTI-LOGOUT', getText('login', 'refreshFbstateSuccess', path.basename(dirAccount)));
				}
				catch (err) {
					log.warn('ANTI-LOGOUT', getText('login', 'refreshFbstateError', path.basename(dirAccount)), err);
				}
				setTimeout(() => changeFbStateByCode = false, 1000);
			}


			setInterval(async () => {
				try {
					if (api && typeof api.getAppState === 'function') {
						const currentState = api.getAppState();
						const filteredState = filterKeysAppState(currentState);
						writeFileSync(dirAccount, JSON.stringify(filteredState, null, 2));
						console.log(`[ANTI-LOGOUT] ✓ Cookie auto-refreshed at ${new Date().toLocaleTimeString()}`);
					}
				} catch (err) {
					console.warn('[ANTI-LOGOUT] Refresh failed:', err.message);
				}
			}, 30 * 60 * 1000); 




			let reconnectAttempts = 0;
			const maxReconnectAttempts = 50;
			let autoReconnectInterval;

			function setupAutoReconnect() {
				if (autoReconnectInterval) clearInterval(autoReconnectInterval);

				autoReconnectInterval = setInterval(async () => {
					try {

						await api.getUserInfo(api.getCurrentUserID());
						reconnectAttempts = 0; 
					} catch (error) {
						reconnectAttempts++;
						console.log(`[AUTO-RECONNECT] Connection check failed (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);

						if (reconnectAttempts >= 3) {
							console.log('[AUTO-RECONNECT] Attempting to restore connection...');
							try {

								if (global.GoatBot.Listening) {
									await stopListening();
								}


								await sleep(3000);


								global.GoatBot.Listening = startMqttListener(createCallBackListen());
								console.log('[AUTO-RECONNECT] ✓ Listening restarted successfully');
								reconnectAttempts = 0;
							} catch (reconnectError) {
								console.error('[AUTO-RECONNECT] Failed to reconnect:', reconnectError.message);


								if (reconnectAttempts >= maxReconnectAttempts) {
									console.log('[AUTO-RECONNECT] Too many failures, attempting full relogin...');
									clearInterval(autoReconnectInterval);
										scheduleBotRestart(false, 0);
								}
							}
						}
					}
			}, 3 * 60 * 1000);
			global.autoReconnectInterval = autoReconnectInterval;
			}

			if (hasBanned == true) {
				log.err('GBAN', getText('login', 'youAreBanned'));
				process.exit();
			}


			console.log(gradient('#ff0080', '#ff8c00')('[LOGIN] Loading data...'));
			const { threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, sequelize } = await require(process.env.NODE_ENV === 'development' ? './loadData.dev.js' : './loadData.js')(api, createLine);


			console.log('[LOGIN] usersData loaded:', !!usersData);
			let finalUsersData = usersData;

			if (!usersData || typeof usersData.getName !== 'function') {
				console.log('[LOGIN] Creating emergency usersData');
				finalUsersData = {
					getName: async (userID) => {
						return await safeGetUserName(userID, api, usersData);
					},
					get: async () => null,
					set: async () => null,
					getAll: async () => [],
					create: async () => null
				};
			}


			global.GoatBot.usersData = finalUsersData;


			await require('../custom.js')({ 
				api, 
				threadModel, 
				userModel, 
				dashBoardModel, 
				globalModel, 
				threadsData, 
				usersData: finalUsersData, 
				dashBoardData, 
				globalData, 
				getText 
			});


			await require(process.env.NODE_ENV === 'development' ? './loadScripts.dev.js' : './loadScripts.js')(
				api, 
				threadModel, 
				userModel, 
				dashBoardModel, 
				globalModel, 
				threadsData, 
				finalUsersData, 
				dashBoardData, 
				globalData, 
				createLine
			);


			if (global.GoatBot.config.autoLoadScripts?.enable == true) {
				const ignoreCmds = global.GoatBot.config.autoLoadScripts.ignoreCmds?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];
				const ignoreEvents = global.GoatBot.config.autoLoadScripts.ignoreEvents?.replace(/[ ,]+/g, ' ').trim().split(' ') || [];

				watch(`${process.cwd()}/scripts/cmds`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreCmds.includes(filename) || filename.endsWith('.eg.js')) {
								return;
						}
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/cmds/${filename}`)) {
							try {
								const contentCommand = global.temp.contentScripts.cmds[filename] || '';
								const currentContent = readFileSync(`${process.cwd()}/scripts/cmds/${filename}`, 'utf-8');
								if (contentCommand == currentContent) {
										return;
								}
								global.temp.contentScripts.cmds[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts(
									'cmds', 
									filename, 
									log, 
									global.GoatBot.configCommands, 
									api, 
									threadModel, 
									userModel, 
									dashBoardModel, 
									globalModel, 
									threadsData, 
									finalUsersData, 
									dashBoardData, 
									globalData
								);
								if (infoLoad.status == 'success') {
									log.master("AUTO LOAD SCRIPTS", `Command ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								}
								else {
										log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, infoLoad.error);
								}
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload command ${filename}.js`, err);
							}
						}
					}
				});

				watch(`${process.cwd()}/scripts/events`, async (event, filename) => {
					if (filename.endsWith('.js')) {
						if (ignoreEvents.includes(filename) || filename.endsWith('.eg.js')) {
								return;
						}
						if ((event == 'change' || event == 'rename') && existsSync(`${process.cwd()}/scripts/events/${filename}`)) {
							try {
								const contentEvent = global.temp.contentScripts.events[filename] || '';
								const currentContent = readFileSync(`${process.cwd()}/scripts/events/${filename}`, 'utf-8');
								if (contentEvent == currentContent) {
									return;
								}
								global.temp.contentScripts.events[filename] = currentContent;
								filename = filename.replace('.js', '');

								const infoLoad = global.utils.loadScripts(
									'events', 
									filename, 
									log, 
									global.GoatBot.configCommands, 
									api, 
									threadModel, 
									userModel, 
									dashBoardModel, 
									globalModel, 
									threadsData, 
									finalUsersData, 
									dashBoardData, 
									globalData
								);
								if (infoLoad.status == 'success') {
									log.master("AUTO LOAD SCRIPTS", `Event ${filename}.js (${infoLoad.command.config.name}) has been reloaded`);
								}
								else {
										log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, infoLoad.error);
								}
							}
							catch (err) {
								log.err("AUTO LOAD SCRIPTS", `Error when reload event ${filename}.js`, err);
							}
						}
					}
				});
			}


			logColor('#f5ab00', character);
			let i = 0;
			const adminBot = global.GoatBot.config.adminBot
				.filter(item => !isNaN(item))
				.map(item => item = item.toString());

			for (const uid of adminBot) {
				try {
					const userName = await safeGetUserName(uid, api, finalUsersData);
					log.master("ADMINBOT", `[${++i}] ${uid} | ${userName}`);
				}
				catch (e) {
					console.error(`[ADMINBOT ERROR] Failed to get name for ${uid}:`, e);
					log.master("ADMINBOT", `[${++i}] ${uid}`);
				}
			}

			console.log(gradient('#00b4db', '#0083b0')(createLine('✓ BOT STARTED SUCCESSFULLY ✓', true)));

			log.master('SUCCESS', getText('login', 'runBot'));
			log.master("LOAD TIME", `${convertTime(Date.now() - global.GoatBot.startTime)}`);
			logColor('#f5ab00', createLine('COPYRIGHT'));

			console.log(`\x1b[1m\x1b[33m${("COPYRIGHT:")}\x1b[0m\x1b[1m\x1b[37m \x1b[0m\x1b[1m\x1b[36m${("Project X69X BOT V3 by Azadx69x (https://github.com/azadx69x/X69X-BOT-V3). Please do not sell this source code or claim it as your own. Thank you!")}\x1b[0m`);
			logColor('#f5ab00', character);

			global.GoatBot.config.adminBot = adminBot;
			writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			writeFileSync(global.client.dirConfigCommands, JSON.stringify(global.GoatBot.configCommands, null, 2));

				const { restartListenMqtt } = global.GoatBot.config;
				let intervalCheckLiveCookieAndRelogin = false;
				let mqttStandardFailed = false;
				let mqttFailoverInProgress = false;

			async function callBackListen(error, event) {
				if (error) {
					global.responseUptimeCurrent = responseUptimeError;
						const listenErrorText = getListenErrorText(error);
						const isCheckpoint = /checkpoint|suspend|disabled|locked|automated behavior/.test(listenErrorText);
						const isConnectionFailure = /not logged in|connection refused|server unavailable|connection closed|mqtt|socket|econnreset|enotfound|timed out/.test(listenErrorText);
						if (error.transient === true && !isCheckpoint) {
							log.warn('LISTEN_MQTT', 'Transient MQTT disconnect; listener will reconnect without restarting the account');
							return;
						}
						if (
						isConnectionFailure ||
						isCheckpoint
					) {
						log.err('NOT LOGGED IN', getText('login', 'notLoggedIn'), error);
						global.responseUptimeCurrent = responseUptimeError;
						global.statusAccountBot = 'can\'t login';
						if (!isSendNotiErrorMessage) {
							await handlerWhenListenHasError({ 
								api, 
								threadModel, 
								userModel, 
								dashBoardModel, 
								globalModel, 
								threadsData, 
								usersData: finalUsersData, 
								dashBoardData, 
								globalData, 
								error 
							});
							isSendNotiErrorMessage = true;
						}

							if (isCheckpoint) {
								log.err('FACEBOOK CHECKPOINT', 'Facebook blocked this session with a checkpoint. Complete the review in a normal browser; automatic relogin is paused to avoid repeated failed attempts.');
								return;
							}

						const dirAccount2 = path.join(process.cwd(), 'account2.txt');
						let switchedToBackup = false;


						const errMsg = (error && (error.error || error.message || String(error))).toLowerCase() || '';
						let switchReason = 'UNKNOWN';
						let switchDetail = 'Unknown error triggered account switch';
						if (errMsg.includes('not logged in') || errMsg.includes('connection refused')) {
							switchReason = 'LOGGED_OUT';
							switchDetail = 'Account was logged out by Facebook (cookie expired or session killed)';
						} else if (errMsg.includes('suspend') || errMsg.includes('disabled') || errMsg.includes('checkpoint') || errMsg.includes('block')) {
							switchReason = 'SUSPENDED';
							switchDetail = 'Account suspended / disabled / checkpoint triggered by Facebook';
						} else if (errMsg.includes('server unavailable') || errMsg.includes('mqtt')) {
							switchReason = 'SERVER_ERROR';
							switchDetail = 'Facebook server error / MQTT connection dropped';
						}

						console.log('\n' + '='.repeat(60));
						console.log('[ACCOUNT SWITCH] Reason  : ' + switchReason);
						console.log('[ACCOUNT SWITCH] Detail  : ' + switchDetail);
						console.log('[ACCOUNT SWITCH] RawError: ' + (error && (error.error || error.message) || String(error)));
						console.log('='.repeat(60) + '\n');

						try {
							if (existsSync(dirAccount2)) {
								const backupContent = (readFileSync(dirAccount2, 'utf8') || '').trim();
								if (backupContent) {
									log.warn("BACKUP ACCOUNT", `[${switchReason}] Primary account problem! Switching to account2.txt...`);
									const primaryContent = readFileSync(dirAccount, 'utf8');
									writeFileSync(dirAccount2, primaryContent);
									writeFileSync(dirAccount, backupContent);
									switchedToBackup = true;
									log.info("BACKUP ACCOUNT", `[${switchReason}] Switched to account2.txt successfully! Reconnecting in 3s, uptime preserved.`);
										scheduleBotRestart(false, 3000);
								} else {
									log.warn("BACKUP ACCOUNT", `[${switchReason}] account2.txt is EMPTY — no backup cookie available, cannot switch.`);
								}
							} else {
								log.warn("BACKUP ACCOUNT", `[${switchReason}] account2.txt not found. Please create it with a backup FB cookie.`);
							}
						} catch (swErr) {
							log.err("BACKUP ACCOUNT", `[${switchReason}] Error during account switch:`, swErr.message);
						}


						if (!switchedToBackup) {
							if (facebookAccount.email && facebookAccount.password) {
								log.info("AUTO RELOGIN", `Email/password found in config — re-logging in automatically in 5s...`);
									scheduleBotRestart(true, 5000);
							} else if (global.GoatBot.config.autoRestartWhenListenMqttError) {
									scheduleBotRestart(false, 5000);
							} else {
								const keyListen = Object.keys(callbackListenTime).pop();
								if (callbackListenTime[keyListen]) {
										callbackListenTime[keyListen] = () => { };
								}
								const cookieString = appState.map(i => i.key + '=' + i.value).join('; ');

								let times = 5;
								const spin = createOraDots(getText('login', 'retryCheckLiveCookie', times));
								const countTimes = setInterval(() => {
									times--;
									if (times == 0) {
											times = 5;
									}
									spin.text = getText('login', 'retryCheckLiveCookie', times);
								}, 1000);

								if (intervalCheckLiveCookieAndRelogin == false) {
									intervalCheckLiveCookieAndRelogin = true;
									const interval = setInterval(async () => {
										const cookieIsLive = await checkLiveCookie(cookieString, facebookAccount.userAgent);
										if (cookieIsLive) {
											clearInterval(interval);
											clearInterval(countTimes);
											intervalCheckLiveCookieAndRelogin = false;
											const keyListen = Date.now();
											isSendNotiErrorMessage = false;
											global.GoatBot.Listening = startMqttListener(createCallBackListen(keyListen));
										}
									}, 5000);
								}
							}
						}
						return;
					}
					else if (error == 'Connection closed.' || error == 'Connection closed by user.') {
						return;
					}
					else {
						await handlerWhenListenHasError({ 
							api, 
							threadModel, 
							userModel, 
							dashBoardModel, 
							globalModel, 
							threadsData, 
							usersData: finalUsersData, 
							dashBoardData, 
							globalData, 
							error 
						});
						return log.err('LISTEN_MQTT', getText('login', 'callBackError'), error);
					}
				}
				global.responseUptimeCurrent = responseUptimeSuccess;
				global.statusAccountBot = 'good';
				const configLog = global.GoatBot.config.logEvents;
				if (isSendNotiErrorMessage == true) {
						isSendNotiErrorMessage = false;
				}
				// Normalize Facebook IDs before applying whitelist rules.
				// FCA can provide the same ID as either a string or a number.
				const senderID = String(event.senderID || event.userID || '');
				const threadID = String(event.threadID || '');
				const adminBotIDs = (global.GoatBot.config.adminBot || []).map(String);
				const whiteListUserIDs = (global.GoatBot.config.whiteListMode?.whiteListIds || []).map(String);
				const whiteListThreadIDs = (global.GoatBot.config.whiteListModeThread?.whiteListThreadIds || []).map(String);
				const isAdminBot = adminBotIDs.includes(senderID);
				const isWhiteListedUser = whiteListUserIDs.includes(senderID);
				const isWhiteListedThread = whiteListThreadIDs.includes(threadID);
				const userWhitelistEnabled = global.GoatBot.config.whiteListMode?.enable == true;
				const threadWhitelistEnabled = global.GoatBot.config.whiteListModeThread?.enable == true;

				if (userWhitelistEnabled && threadWhitelistEnabled) {
					if (!isAdminBot && !isWhiteListedUser && !isWhiteListedThread) {
							return;
					}
				}
				else if (userWhitelistEnabled) {
					if (!isAdminBot && !isWhiteListedUser) {
							return;
					}
				}
				else if (threadWhitelistEnabled) {
					if (!isAdminBot && !isWhiteListedThread) {
							return;
					}
				}

				if (event.messageID && event.type == 'message') {
					if (storage5Message.includes(event.messageID)) {
						Object.keys(callbackListenTime).slice(0, -1).forEach(key => {
							callbackListenTime[key] = () => { };
						});
					}
					else {
							storage5Message.push(event.messageID);
					}
					if (storage5Message.length > 5) {
							storage5Message.shift();
					}
				}

				if (configLog.disableAll === false && configLog[event.type] !== false) {
					const participantIDs_ = [...event.participantIDs || []];
					if (event.participantIDs) {
							event.participantIDs = 'Array(' + event.participantIDs.length + ')';
					}
					console.log(colors.green((event.type || '').toUpperCase() + ':'), jsonStringifyColor(event, null, 2));

					if (event.participantIDs) {
							event.participantIDs = participantIDs_;
					}
				}

				if ((event.senderID && dataGban[event.senderID] || event.userID && dataGban[event.userID])) {
					if (event.body && event.threadID) {
						const prefix = getPrefix(event.threadID);
						if (event.body.startsWith(prefix)) {
								return api.sendMessage(getText('login', 'userBanned'), event.threadID);
						}
						return;
					}
					else {
							return;
					}
				}

				const handlerAction = require('../handler/handlerAction.js')(
					api, 
					threadModel, 
					userModel, 
					dashBoardModel, 
					globalModel, 
					finalUsersData, 
					threadsData, 
					dashBoardData, 
					globalData
				);

				if (hasBanned === false) {
					handlerAction(event).catch(err => {
						log.err('HANDLER', getText('login', 'callBackError'), err);
					});
				}
				else {
						return log.err('GBAN', getText('login', 'youAreBanned'));
				}
			}

			function createCallBackListen(key) {
				key = randomString(10) + (key || Date.now());
				callbackListenTime[key] = callBackListen;
				return function (error, event) {
					callbackListenTime[key](error, event);
				};
			}

			function isMqttConnectionFailure(error) {
				const text = String(error?.error || error?.message || error || '').toLowerCase();
				return /mqtt|listenmqttpro|socket|connection|timed out|timeout|econnreset|enotfound|server unavailable|reconnect limit|reconnect budget/.test(text);
			}

			function startMqttListener(callback, forcePro = false) {
				const usePro = forcePro || mqttStandardFailed;
				const listener = usePro ? api.listenPro : api.listenMqtt;
				if (typeof listener !== 'function') {
						throw new Error('No MQTT listener is available');
				}
				log.info("LISTEN_MQTT", `Starting ${usePro ? "listenMqttPro" : "listenMqtt"}`);
				if (usePro) return listener(callback);

				const failoverCallback = (error, event) => {
					if (!error || !isMqttConnectionFailure(error)) {
							return callback(error, event);
					}
					if (mqttStandardFailed || mqttFailoverInProgress) return;

					mqttStandardFailed = true;
					mqttFailoverInProgress = true;
					log.warn('LISTEN_MQTT', 'listenMqtt failed; switching to listenMqttPro');

					(async () => {
						try {
							await stopListening();
							await sleep(1000);
							global.GoatBot.Listening = startMqttListener(callback, true);
						}
						catch (failoverError) {
							log.err('LISTEN_MQTT', 'listenMqttPro fallback failed', failoverError);
							callback(failoverError);
						}
						finally {
							mqttFailoverInProgress = false;
						}
					})();
				};

				return listener(failoverCallback);
			}

			await stopListening();
			global.GoatBot.Listening = startMqttListener(createCallBackListen());
			global.GoatBot.callBackListen = callBackListen;


			setupAutoReconnect();


			global.memoryCleanupInterval = setInterval(() => {
				try {

					const activeKeys = Object.keys(callbackListenTime).filter(k => typeof callbackListenTime[k] === 'function' && callbackListenTime[k] !== (function(){}));
					for (const k of Object.keys(callbackListenTime)) {
						if (!activeKeys.includes(k) || callbackListenTime[k].toString() === '() => { }') {
							delete callbackListenTime[k];
						}
					}


					const now = Date.now();
					for (const [msgID, entry] of global.GoatBot.onReply.entries()) {
						if (entry.createdAt && now - entry.createdAt > 10 * 60 * 1000) {
								global.GoatBot.onReply.delete(msgID);
						}
					}


					for (const [msgID, entry] of global.GoatBot.onReaction.entries()) {
						if (entry.createdAt && now - entry.createdAt > 10 * 60 * 1000) {
								global.GoatBot.onReaction.delete(msgID);
						}
					}


					for (const cmd of Object.keys(global.client.countDown)) {
						if (typeof global.client.countDown[cmd] !== 'object') continue;
						for (const uid of Object.keys(global.client.countDown[cmd])) {
							if (now - global.client.countDown[cmd][uid] > 5 * 60 * 1000) {
									delete global.client.countDown[cmd][uid];
							}
						}
					}

				} catch (err) {
					console.warn('[MEMORY] Cleanup error:', err.message);
				}
			}, 10 * 60 * 1000);

			if ((global.GoatBot.config.serverUptime.enable == true || process.env.PORT) && !global.serverUptimeRunning) {
				const http = require('http');
				const express = require('express');
				const app = express();
				const server = http.createServer(app);


				const html = '<html><body><h1>Bot is running</h1><p>Uptime: ' + process.uptime() + ' seconds</p></body></html>';

				const PORT = process.env.PORT || (!isNaN(global.GoatBot.config.serverUptime.port) && global.GoatBot.config.serverUptime.port) || 3001;
				app.get('/', (req, res) => res.send(html));
				app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));
				app.get('/uptime', global.responseUptimeCurrent);
				let nameUpTime;
				try {
					if (process.env.RENDER_EXTERNAL_URL) {
						nameUpTime = process.env.RENDER_EXTERNAL_URL;
					} else if (process.env.RAILWAY_PUBLIC_DOMAIN) {
						nameUpTime = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
					} else if (process.env.RAILWAY_STATIC_URL) {
						nameUpTime = process.env.RAILWAY_STATIC_URL;
					} else if (process.env.REPL_OWNER) {
						nameUpTime = `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`;
					} else if (process.env.API_SERVER_EXTERNAL == 'https://api.glitch.com') {
						nameUpTime = `https://${process.env.PROJECT_DOMAIN}.glitch.me`;
					} else if (process.env.BASE_URL) {
						nameUpTime = process.env.BASE_URL;
					} else {
						nameUpTime = `http://localhost:${PORT}`;
					}
					nameUpTime = nameUpTime.replace(/\/$/, '');
					await server.listen(PORT);
					log.info('UPTIME', getText('login', 'openServerUptimeSuccess', nameUpTime));
					if (global.GoatBot.config.serverUptime.socket?.enable == true) {
							require('./socketIO.js')(server);
					}
					global.serverUptimeRunning = true;
				}
				catch (err) {
					if (err.code === 'EADDRINUSE') {
						log.warn("UPTIME", `Port ${PORT} in use, skipping`);
					} else {
						log.err('UPTIME', getText('login', 'openServerUptimeError'), err);
					}
				}
			}

			if (restartListenMqtt.enable == true) {
				const configuredRestartDelay = Number(restartListenMqtt.timeRestart);
				const minimumRestartDelay = 30 * 24 * 60 * 60 * 1000;
				const restartDelay = Number.isFinite(configuredRestartDelay) && configuredRestartDelay > 0
					? Math.max(configuredRestartDelay, minimumRestartDelay)
					: configuredRestartDelay;
				if (restartListenMqtt.logNoti == true) {
					log.info('LISTEN_MQTT', getText('login', 'restartListenMessage', convertTime(restartDelay, true)));
					if (configuredRestartDelay > 0 && configuredRestartDelay < minimumRestartDelay) {
							log.warn('LISTEN_MQTT', 'Configured restart interval was below 30 days; using the safe 30-day minimum');
					}
					log.info('BOT_STARTED', getText('login', 'startBotSuccess'));
					logColor('#f5ab00', character);
				}
				const maxTimerDelay = 2147483647;
				const scheduleRestart = (remaining) => {
					const delay = Math.min(remaining, maxTimerDelay);
					const restart = setTimeout(async function () {
						if (restartListenMqtt.enable == false) {
								return log.warn('LISTEN_MQTT', getText('login', 'stopRestartListenMessage'));
						}
						if (remaining > delay) {
								return scheduleRestart(remaining - delay);
						}
						try {
							await stopListening();
							await sleep(1000);
							global.GoatBot.Listening = startMqttListener(createCallBackListen());
							log.info('LISTEN_MQTT', getText('login', 'restartListenMessage2'));
						}
						catch (e) {
							log.err('LISTEN_MQTT', getText('login', 'restartListenMessageError'), e);
						}
						finally {
							if (restartListenMqtt.enable == true) {
									scheduleRestart(restartDelay);
							}
						}
					}, delay);
					global.intervalRestartListenMqtt = restart;
				};
				if (Number.isFinite(restartDelay) && restartDelay > 0) {
					scheduleRestart(restartDelay);
				}
				else {
						log.warn('LISTEN_MQTT', 'Invalid restartListenMqtt.timeRestart; automatic listener restart disabled');
				}
			}
			require('../autoUptime.js');
		});
	})(appState);

	if (global.GoatBot.config.autoReloginWhenChangeAccount) {
		setTimeout(function () {
			watch(dirAccount, async (type) => {
				if (type == 'change' && changeFbStateByCode == false && latestChangeContentAccount != fs.statSync(dirAccount).mtimeMs) {
					clearInterval(global.intervalRestartListenMqtt);
					global.compulsoryStopLisening = true;
					latestChangeContentAccount = fs.statSync(dirAccount).mtimeMs;
					startBot();
				}
			});
		}, 10000);
	}
}

global.GoatBot.reLoginBot = startBot;
startBot();
