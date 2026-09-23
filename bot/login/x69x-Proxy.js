// Made by @Azadx69x
"use strict";

const axios   = require("axios");
const https   = require("https");
const http    = require("http");
const { SocksProxyAgent } = require("socks-proxy-agent");

let HttpsProxyAgent = null;
let HttpProxyAgent  = null;
try { ({ HttpsProxyAgent } = require("https-proxy-agent")); } catch (_) {}
try { ({ HttpProxyAgent  } = require("http-proxy-agent"));  } catch (_) {}

const CONFIG = {
        timeout          : 30000,
        maxRedirects     : 5,
        failureCooldown  : 30000,
        maxCooldown      : 5 * 60 * 1000,
        proxyRequired    : false,
        keepAlive        : true,
        proxies          : [
                { type: "http", host: "41.128.72.140", port: 1976 },
        ],
        validateUrl      : "https://www.google.com/generate_204",
};

const SUPPORTED_TYPES = new Set(["http", "https", "socks4", "socks5"]);

const agentCache = new Map();

function getHttpsAgent(proxyUrl) {
        const key = `https:${proxyUrl}`;
        if (agentCache.has(key)) return agentCache.get(key);

        let agent;
        if (HttpsProxyAgent) {
                agent = new HttpsProxyAgent(proxyUrl);
        } else {
                agent = new https.Agent({ keepAlive: CONFIG.keepAlive });
        }
        agentCache.set(key, agent);
        return agent;
}

function getHttpAgent(proxyUrl) {
        const key = `http:${proxyUrl}`;
        if (agentCache.has(key)) return agentCache.get(key);

        let agent;
        if (HttpProxyAgent) {
                agent = new HttpProxyAgent(proxyUrl, { keepAlive: CONFIG.keepAlive });
        } else {
                agent = new http.Agent({ keepAlive: CONFIG.keepAlive });
        }
        agentCache.set(key, agent);
        return agent;
}

function parseProxyUrl(value) {
        const raw = String(value || "").trim();
        if (!raw) return null;

        try {
                const url  = new URL(raw.includes("://") ? raw : `http://${raw}`);
                const type = url.protocol.replace(":", "").toLowerCase();
                const port = Number(url.port || (type === "https" ? 443 : type.startsWith("socks") ? 1080 : 80));

                if (!SUPPORTED_TYPES.has(type) || !url.hostname || !Number.isInteger(port) || port < 1 || port > 65535) {
                        return null;
                }

                return {
                        type,
                        host     : url.hostname,
                        port,
                        username : url.username ? decodeURIComponent(url.username) : "",
                        password : url.password ? decodeURIComponent(url.password) : "",
                };
        } catch (_) {
                return null;
        }
}

function normalizeProxy(value) {
        if (typeof value === "string") return parseProxyUrl(value);
        if (!value || typeof value !== "object") return null;
        if (value.url) return parseProxyUrl(value.url);

        const type = String(value.type || value.protocol || "http").replace(":", "").toLowerCase();
        const host = String(value.host || "").trim();
        const port = Number(value.port);

        if (!SUPPORTED_TYPES.has(type) || !host || !Number.isInteger(port) || port < 1 || port > 65535) {
                return null;
        }

        return {
                type,
                host,
                port,
                username : String(value.username || value.user || ""),
                password : String(value.password || ""),
        };
}

function flattenProxyInput(value) {
        if (Array.isArray(value)) return value.flatMap(flattenProxyInput);
        if (typeof value === "string") {
                const raw = value.trim();
                if (!raw) return [];
                if (raw.startsWith("[")) {
                        try { return flattenProxyInput(JSON.parse(raw)); }
                        catch (_) { return []; }
                }
                return raw.split(/[\n,]+/).map(item => item.trim()).filter(Boolean);
        }
        return value ? [value] : [];
}

function proxyKey(proxy)      { return `${proxy.type}://${proxy.host}:${proxy.port}`; }
function describeProxy(proxy) { return `${proxy.type}://${proxy.host}:${proxy.port}`; }

function classifyError(error) {
        if (!error) return "unknown";
        if (error.code === "ECONNABORTED" || /timeout/i.test(error.message || "")) return "timeout";
        if (error.code === "ECONNREFUSED") return "refused";
        if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") return "dns";
        if (error.response?.status === 407) return "proxy-auth";
        if (error.code === "ERR_SOCKET_CONNECTION_TIMEOUT") return "socket-timeout";
        return error.code || error.response?.status || "request-failed";
}

class ProxyManager {
        constructor() {
                this.currentIndex = 0;
                this.failures     = new Map();
                this.stats        = { attempts: 0, success: 0, failure: 0, directFallback: 0 };
        }

        getConfiguredProxies(explicitProxy) {
                const account    = global.GoatBot?.config?.facebookAccount || {};
                const configured = explicitProxy !== undefined
                        ? explicitProxy
                        : (account.proxies ?? account.proxy ?? CONFIG.proxies);

                const seen       = new Set();
                const proxyInput = flattenProxyInput(configured);

                if (proxyInput.length === 0) proxyInput.push(...CONFIG.proxies);

                return proxyInput
                        .map(normalizeProxy)
                        .filter(proxy => {
                                if (!proxy) return false;
                                const key = proxyKey(proxy);
                                if (seen.has(key)) return false;
                                seen.add(key);
                                return true;
                        });
        }

        getAllProxies(explicitProxy) { return this.getConfiguredProxies(explicitProxy); }

        getProxyUrl(proxy) {
                const n = normalizeProxy(proxy);
                if (!n) return null;
                const auth = n.username
                        ? `${encodeURIComponent(n.username)}:${encodeURIComponent(n.password)}@`
                        : "";
                return `${n.type}://${auth}${n.host}:${n.port}`;
        }

        getNextProxy(explicitProxy) {
                const proxies = this.getConfiguredProxies(explicitProxy);
                if (proxies.length === 0) return null;
                const proxy = proxies[this.currentIndex % proxies.length];
                this.currentIndex = (this.currentIndex + 1) % proxies.length;
                return proxy;
        }

        isCoolingDown(proxy) {
                const failure = this.failures.get(proxyKey(proxy));
                return Boolean(failure && failure.until > Date.now());
        }

        markSuccess(proxy) {
                this.failures.delete(proxyKey(proxy));
                this.stats.success++;
        }

        markFailure(proxy, error) {
                const key      = proxyKey(proxy);
                const previous = this.failures.get(key);
                const failures = (previous?.count || 0) + 1;
                const cooldown = Math.min(
                        CONFIG.failureCooldown * (2 ** (failures - 1)),
                        CONFIG.maxCooldown
                );

                this.failures.set(key, { count: failures, until: Date.now() + cooldown });
                this.stats.failure++;

                console.warn(
                        `[ProxyManager] ${describeProxy(proxy)} failed ` +
                        `(${classifyError(error)}); cooldown ${Math.round(cooldown / 1000)}s`
                );
        }

        buildRequestConfig(config, proxy) {
                const requestConfig = {
                        ...config,
                        timeout        : config.timeout || CONFIG.timeout,
                        maxRedirects   : config.maxRedirects ?? CONFIG.maxRedirects,
                        validateStatus : config.validateStatus || (s => s >= 200 && s < 400),
                        httpsAgent     : config.httpsAgent || new https.Agent({ keepAlive: CONFIG.keepAlive }),
                        httpAgent      : config.httpAgent  || new http.Agent({ keepAlive: CONFIG.keepAlive }),
                        proxy          : false,
                };

                const proxyUrl = this.getProxyUrl(proxy);

                if (proxy.type === "socks4" || proxy.type === "socks5") {
                        const agent = new SocksProxyAgent(proxyUrl);
                        requestConfig.httpAgent  = agent;
                        requestConfig.httpsAgent = agent;
                        return requestConfig;
                }

                if (HttpsProxyAgent || HttpProxyAgent) {
                        requestConfig.httpAgent  = getHttpAgent(proxyUrl);
                        requestConfig.httpsAgent = getHttpsAgent(proxyUrl);
                        return requestConfig;
                }

                requestConfig.proxy = { protocol: proxy.type, host: proxy.host, port: proxy.port };
                if (proxy.username) {
                        requestConfig.proxy.auth = { username: proxy.username, password: proxy.password };
                }
                return requestConfig;
        }

        shouldUseDirectFallback() {
                return !CONFIG.proxyRequired;
        }

        async requestWithProxy(config, explicitProxy) {
                const proxies = this.getConfiguredProxies(explicitProxy);
                if (proxies.length === 0) return axios(config);

                const startIndex = this.currentIndex % proxies.length;
                let lastError;
                let attempted = 0;

                for (let offset = 0; offset < proxies.length; offset++) {
                        const index = (startIndex + offset) % proxies.length;
                        const proxy = proxies[index];
                        if (this.isCoolingDown(proxy)) continue;

                        attempted++;
                        this.stats.attempts++;
                        try {
                                const response = await axios(this.buildRequestConfig(config, proxy));
                                this.currentIndex = (index + 1) % proxies.length;
                                this.markSuccess(proxy);
                                return response;
                        } catch (error) {
                                lastError = error;
                                this.markFailure(proxy, error);
                        }
                }

                if (attempted === 0) {
                        this.currentIndex = (startIndex + 1) % proxies.length;
                }

                if (this.shouldUseDirectFallback()) {
                        this.stats.directFallback++;
                        return axios(config);
                }

                throw lastError || new Error("All configured proxies are temporarily unavailable");
        }

        async validateProxy(proxy, testUrl = CONFIG.validateUrl) {
                const normalized = normalizeProxy(proxy);
                if (!normalized) return { ok: false, reason: "invalid" };

                const started = Date.now();
                try {
                        const res = await axios(this.buildRequestConfig(
                                { method: "GET", url: testUrl }, normalized
                        ));
                        return { ok: true, status: res.status, latency: Date.now() - started };
                } catch (error) {
                        return { ok: false, reason: classifyError(error), latency: Date.now() - started };
                }
        }

        async validateAll(explicitProxy) {
                const proxies = this.getConfiguredProxies(explicitProxy);
                const results = await Promise.all(
                        proxies.map(async p => ({
                                proxy : describeProxy(p),
                                ...(await this.validateProxy(p)),
                        }))
                );
                return results;
        }

        getStats() {
                return { ...this.stats, cachedAgents: agentCache.size };
        }
}

module.exports = new ProxyManager();
