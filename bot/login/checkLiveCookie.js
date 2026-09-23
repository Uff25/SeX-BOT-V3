// fixed by @Azadx69x
const proxyManager = require('./x69x-Proxy.js');

module.exports = async function (cookie, userAgent) {
        const ua = userAgent || 'Mozilla/5.0 (Linux; Android 15; SM-S918B Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/566.0.0.48.73;IABMV/1;]';
        
        if (!cookie || typeof cookie !== 'string' || cookie.trim() === '' || cookie === 'undefined' || cookie === 'null') {
                return false;
        }

        const cUserMatch = cookie.match(/c_user=(\d+)/);
        const xsMatch = cookie.match(/xs=([^;]+)/);
        if (!cUserMatch || !xsMatch) return false;

        const userId = cUserMatch[1];

        const headers = {
                cookie: cookie,
                "user-agent": ua,
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "accept-language": "en-US,en;q=0.9",
                "accept-encoding": "gzip, deflate, br, zstd",
                "sec-ch-ua": "\"Chromium\";v=\"151\", \"Google Chrome\";v=\"151\", \"Not-A.Brand\";v=\"24\"",
                "sec-ch-ua-mobile": "?1",
                "sec-ch-ua-platform": "\"Android\"",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "sec-fetch-user": "?1",
                "upgrade-insecure-requests": "1",
                "cache-control": "max-age=0"
        };

        const endpoints = [
                'https://mbasic.facebook.com/profile.php',
                'https://mbasic.facebook.com/home.php',
                'https://m.facebook.com/profile.php'
        ];

        let networkErrorCount = 0;

        for (const url of endpoints) {
                try {
                        const response = await proxyManager.requestWithProxy({
                                url: url,
                                method: "GET",
                                maxRedirects: 5,
                                timeout: 15000,
                                headers: headers
                        });

                        const finalUrl = response.request?.res?.responseUrl || response.request?._redirectable?._currentUrl || '';
                        const data = typeof response.data === 'string' ? response.data : '';

                        if (
                                finalUrl.includes('/login/') || 
                                finalUrl.includes('login.php') || 
                                finalUrl.includes('/checkpoint/') || 
                                (data.includes('Log In') && data.includes('password')) ||
                                data.includes('id="login_form"')
                        ) {
                                return false;
                        }

                        if (
                                data.includes(`c_user=${userId}`) || 
                                data.includes(`"USER_ID":"${userId}"`) ||
                                data.includes('mbasic_logout') || 
                                data.includes('href="/logout.php') ||
                                data.includes('id="m_home"')
                        ) {
                                return true;
                        }

                }
                catch (e) {
                        if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ETIMEDOUT' || e.message.includes('timeout')) {
                                networkErrorCount++;
                                continue;
                        }
                        
                        if (e.response) {
                                if (e.response.status === 403 || e.response.status === 401) return false;
                                if (e.response.status === 302 && (e.response.headers?.location || '').includes('login')) return false;
                        }
                }
        }

        if (networkErrorCount === endpoints.length) return true;

        return false;
};
