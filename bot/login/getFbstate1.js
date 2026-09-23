const cheerio = require("cheerio");
const qs = require("qs");
const proxyManager = require('./x69x-Proxy.js');

const TARGET_COOKIE = "https://m.facebook.com/";
const URL_LOGIN_CHECKPOINT = "https://m.facebook.com/login/checkpoint/?next=https://m.facebook.com/home.php?refsrc=deprecated";

function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
}

function randomDelay(min = 800, max = 3000) {
        return sleep(Math.floor(Math.random() * (max - min + 1)) + min);
}

function buildHeaders(userAgent) {
        const ua = userAgent || "Mozilla/5.0 (Linux; Android 12; M2102J20SG) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.0.0 Mobile Safari/537.36";
        return {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "max-age=0",
                "sec-ch-ua": "\"Chromium\";v=\"101\", \"Google Chrome\";v=\"101\", \"Not=A?Brand\";v=\"8\"",
                "sec-ch-ua-mobile": "?1",               
                "sec-ch-ua-platform": "\"Android\"",    
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "user-agent": ua
        };
}

const BI_WVDP = JSON.stringify({
        hwc: true, hwcr: true, has_dnt: false, has_standalone: false,
        wnd_toStr_toStr: "function toString() { [native code] }",
        hasPerm: true,
        permission_query_toString: "function query() { [native code] }",
        permission_query_toString_toString: "function toString() { [native code] }",
        has_seWo: true, has_meDe: true, has_creds: true,
        has_hwi_bt: false, has_agjsi: false,
        iframeProto: "function get contentWindow() { [native code] }",
        remap: false,
        iframeData: {
                hwc: true, hwcr: false, has_dnt: false, has_standalone: false,
                wnd_toStr_toStr: "function toString() { [native code] }",
                hasPerm: true,
                permission_query_toString: "function query() { [native code] }",
                permission_query_toString_toString: "function toString() { [native code] }",
                has_seWo: true, has_meDe: true, has_creds: true,
                has_hwi_bt: false, has_agjsi: false
        }
});

async function checkAndSaveCookies(jar, headers, proxy) {
        await randomDelay(500, 1200);
        const resHome = await proxyManager.requestWithProxy({
                url: TARGET_COOKIE,
                method: "GET",
                maxRedirects: 5,
                timeout: 30000,
                headers: {
                        ...headers,
                        "referer": "https://m.facebook.com/login/",
                        "sec-fetch-site": "same-origin",
                        "Cookie": jar.getCookieString(TARGET_COOKIE)
                }
        }, proxy);

        const finalUrl = resHome.request?.res?.responseUrl || resHome.request?.uri?.href || "";
        const referer = resHome.request?.headers?.referer || "";

        if (finalUrl.includes("/checkpoint/") || referer.match(/checkpoint\/\d+/)) {
                const match = (finalUrl + referer).match(/checkpoint\/(\d+)/);
                const code = match ? match[1] : "unknown";
                const err = new Error(`Account checkpointed (${code}). Please log into Facebook and complete verification.`);
                err.name = `CHECKPOINT_${code}`;
                throw err;
        }

        return jar.getCookies(TARGET_COOKIE);
}

module.exports = async function (email, pass, userAgent, proxy) {
        const headers = buildHeaders(userAgent);

        let _request;
        const requestDefaults = { jar: true, headers, simple: false, followAllRedirects: true };
        if (proxy)
                _request = require("request").defaults({ ...requestDefaults, proxy });
        else
                _request = require("request").defaults(requestDefaults);

        const request = options => new Promise((resolve, reject) => {
                _request(options, (err, res) => {
                        if (err) return reject(err);
                        resolve(res);
                });
        });

        const jar = _request.jar();

        jar.setCookie("locale=en_US", TARGET_COOKIE);
        jar.setCookie("noscript=1", TARGET_COOKIE);

        await randomDelay(600, 1500);
        const res1 = await request({
                url: "https://m.facebook.com/login/",
                method: "GET",
                jar,
                headers: {
                        ...headers,
                        "sec-fetch-site": "none"
                }
        });

        let $ = cheerio.load(res1.body);

        const formData1 = { ...qs.parse($("#login_form").serialize()) };
        delete formData1.pass;

        formData1.email = email;
        formData1.encpass = `#PWD_BROWSER:0:${~~(Date.now() / 1000)}:${pass}`;
        formData1.prefill_contact_point = email;
        formData1.bi_wvdp = BI_WVDP;
        formData1.prefill_source = "browser_dropdown";
        formData1.prefill_type = "password";
        formData1.first_prefill_source = "browser_dropdown";
        formData1.first_prefill_type = "contact_point";
        formData1.had_cp_prefilled = "true";
        formData1.had_password_prefilled = "true";
        formData1.is_smart_lock = "false";
        formData1.bi_xrwh = "0";
        formData1.try_number = "0";
        formData1.unrecognized_tries = "0";

        await randomDelay(1500, 4000);
        const res2 = await request({
                url: "https://m.facebook.com/login/device-based/login/async/?refsrc=deprecated&lwv=100",
                method: "POST",
                jar,
                form: formData1,
                headers: {
                        ...headers,
                        "content-type": "application/x-www-form-urlencoded",
                        "origin": "https://m.facebook.com",
                        "referer": "https://m.facebook.com/login/",
                        "sec-fetch-site": "same-origin",
                        "sec-fetch-mode": "navigate"
                }
        });

        if (res2.body.includes("You used an old password")) {
                const err = new Error("You used an old password");
                err.name = "OLD_PASSWORD";
                throw err;
        }

        if (
                res2.body.includes(`href=\\"\\/recover\\/initiate\\/?email=${email}&amp;ars=facebook_login_pw_error`) ||
                res2.body.includes(`"m_login_notice":"Invalid username or password"`) ||
                res2.body.includes("Incorrect password.") ||
                res2.body.includes("forgot_password_uri") ||
                res2.headers.location?.includes("m_lara_first_password_failure")
        ) {
                const err = new Error("Wrong username or password");
                err.name = "WRONG_ACCOUNT";
                throw err;
        }

        if (jar.getCookieString(TARGET_COOKIE).includes("c_user"))
                return await checkAndSaveCookies(jar, headers, proxy);

        await randomDelay(800, 2000);
        const res3 = await request({
                url: "https://m.facebook.com/checkpoint/?next=https://m.facebook.com/home.php?refsrc=deprecated&__req=6",
                method: "GET",
                jar,
                headers: {
                        ...headers,
                        "referer": "https://m.facebook.com/login/device-based/login/async/?refsrc=deprecated&lwv=100",
                        "sec-fetch-site": "same-origin"
                }
        });

        if (jar.getCookieString(TARGET_COOKIE).includes("c_user"))
                        return await checkAndSaveCookies(jar, headers, proxy);

        $ = cheerio.load(res3.body);

        if (
                !res2.body &&
                res3.body.includes('<form method="post" action="/login/device-based') &&
                $('button[name="login"]').length
        ) {
                const err = new Error("Cannot login — please open Facebook in a browser and verify your account");
                err.name = "CANNOT_LOGIN";
                throw err;
        }

        const formData2 = { ...qs.parse($('form[method="post"][class="checkpoint"]').serialize()) };
        formData2["submit[Submit Code]"] = $('button[name="submit[Submit Code]"]').text();

        if (($("title").text() || "").includes("Login approval needed"))
                throw {
                        name: "LOGIN_APPROVED_REQUIRE",
                        message: "Login approval needed — please verify from your trusted device"
                };

        if ($("#checkpoint_title")?.text()?.includes("Enter login code to continue")) {
                throw {
                        name: "2FA_CODE_REQUIRED",
                        message: "2FA code required — call continue() with the code",
                        continue: async function submit2FA(code) {
                                formData2.approvals_code = code;

                                await randomDelay(800, 2000);
                                const res4 = await request({
                                        url: URL_LOGIN_CHECKPOINT,
                                        method: "POST",
                                        form: formData2,
                                        jar,
                                        headers: {
                                                ...headers,
                                                "content-type": "application/x-www-form-urlencoded",
                                                "origin": "https://m.facebook.com",
                                                "referer": "https://m.facebook.com/checkpoint/",
                                                "sec-fetch-site": "same-origin"
                                        }
                                });

                                if (jar.getCookieString(TARGET_COOKIE).includes("c_user"))
                                        return await checkAndSaveCookies(jar, headers, proxy);

                                $ = cheerio.load(res4.body);
                                if ($('button[name="submit[Submit Code]"]').text() === formData2["submit[Submit Code]"])
                                        throw {
                                                name: "2FA_CODE_INVALID",
                                                message: "2FA code is invalid — try again",
                                                continue: submit2FA
                                        };

                                const formData3 = { ...qs.parse($('form[method="post"][class="checkpoint"]').serialize()) };
                                delete formData3.approvals_code;
                                formData3.name_action_selected = "save_device";
                                formData3["submit[Continue]"] = $("#checkpointSubmitButton").text();

                                await randomDelay(600, 1500);
                                const res5 = await request({
                                        url: URL_LOGIN_CHECKPOINT,
                                        method: "POST",
                                        form: formData3,
                                        jar,
                                        headers: {
                                                ...headers,
                                                "content-type": "application/x-www-form-urlencoded",
                                                "origin": "https://m.facebook.com",
                                                "referer": "https://m.facebook.com/checkpoint/",
                                                "sec-fetch-site": "same-origin"
                                        }
                                });

                                if (jar.getCookieString(TARGET_COOKIE).includes("c_user"))
                                        return await checkAndSaveCookies(jar, headers, proxy);

                                $ = cheerio.load(res5.body);
                                const formData4 = { ...qs.parse($('form[method="post"][class="checkpoint"]').serialize()) };
                                delete formData4.approvals_code;
                                formData4["submit[Continue]"] = $('button[name="submit[Continue]"]').text();

                                await randomDelay(600, 1500);
                                const res6 = await request({
                                        url: URL_LOGIN_CHECKPOINT,
                                        method: "POST",
                                        form: formData4,
                                        jar,
                                        headers: {
                                                ...headers,
                                                "content-type": "application/x-www-form-urlencoded",
                                                "origin": "https://m.facebook.com",
                                                "referer": "https://m.facebook.com/checkpoint/",
                                                "sec-fetch-site": "same-origin"
                                        }
                                });

                                if (jar.getCookieString(TARGET_COOKIE).includes("c_user"))
                                        return await checkAndSaveCookies(jar, headers, proxy);

                                $ = cheerio.load(res6.body);
                                const formData5 = { ...qs.parse($('form[method="post"][class="checkpoint"]').serialize()) };
                                delete formData5.approvals_code;
                                formData5["submit[This was me]"] = $('button[name="submit[This was me]"]').text();

                                await randomDelay(600, 1500);
                                const res7 = await request({
                                        url: URL_LOGIN_CHECKPOINT,
                                        method: "POST",
                                        form: formData5,
                                        jar,
                                        headers: {
                                                ...headers,
                                                "content-type": "application/x-www-form-urlencoded",
                                                "origin": "https://m.facebook.com",
                                                "referer": "https://m.facebook.com/checkpoint/",
                                                "sec-fetch-site": "same-origin"
                                        }
                                });

                                if (jar.getCookieString(TARGET_COOKIE).includes("c_user"))
                                        return await checkAndSaveCookies(jar, headers, proxy);

                                $ = cheerio.load(res7.body);
                                const formData6 = { ...qs.parse($('form[method="post"][class="checkpoint"]').serialize()) };
                                delete formData6.approvals_code;
                                formData6.name_action_selected = "save_device";
                                formData6["submit[Continue]"] = $("#checkpointSubmitButton").text();

                                await randomDelay(600, 1500);
                                await request({
                                        url: URL_LOGIN_CHECKPOINT,
                                        method: "POST",
                                        form: formData6,
                                        jar,
                                        headers: {
                                                ...headers,
                                                "content-type": "application/x-www-form-urlencoded",
                                                "origin": "https://m.facebook.com",
                                                "referer": "https://m.facebook.com/checkpoint/",
                                                "sec-fetch-site": "same-origin"
                                        }
                                });

                                if (jar.getCookieString(TARGET_COOKIE).includes("c_user"))
                                        return await checkAndSaveCookies(jar, headers, proxy);

                                const err = new Error("Cannot login — please open Facebook in a browser and verify your account");
                                err.name = "LOGIN_FAILED";
                                throw err;
                        }
                };
        }

        const err = new Error("Cannot login — please open Facebook in a browser and verify your account");
        err.name = "LOGIN_FAILED";
        err.response = res3;
        throw err;
};
