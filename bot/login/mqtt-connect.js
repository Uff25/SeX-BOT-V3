"use strict";

const mqtt = require("mqtt");
const log = require("npmlog");
const proxyManager = require('./x69x-Proxy.js');

const FACEBOOK_MQTT_URL = "wss://edge-mqtt.facebook.com/chat";

const DEFAULT_OPTIONS = {
  clientId: `mqttjs_${Math.random().toString(16).slice(2, 10)}`,
  protocolId: "MQIsdp",
  protocolVersion: 3,
  clean: true,
  keepalive: 60,
  reconnectPeriod: 0,
  connectTimeout: 30000,
  queueQoSZero: false,
  wsOptions: {
    headers: {
      "Origin": "https://www.facebook.com",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
    },
  },
};

function connectMqtt(url, options = {}) {
  const mqttUrl = (typeof url === "string" && url.startsWith("ws")) ? url : FACEBOOK_MQTT_URL;
  const mqttOpts = { ...DEFAULT_OPTIONS, ...options };

  let reconnectCount = 0;
  let reconnectTimer = null;
  let heartbeatTimer = null;
  let destroyed = false;
  let client = null;

  const proxies = proxyManager.getAllProxies();
  let currentProxyIndex = 0;

  function getNextProxy() {
    if (proxies.length === 0) return null;
    const proxy = proxies[currentProxyIndex];
    currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
    return proxy;
  }

  function buildMqttOptions(proxy) {
    const opts = { ...mqttOpts };
    
    if (proxy) {
      let agent = null;
      if (proxy.type === 'socks5' || proxy.type === 'socks4') {
        const SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent;
        agent = new SocksProxyAgent(proxyManager.getProxyUrl(proxy));
      } else {
        const HttpsProxyAgent = require('https-proxy-agent').HttpsProxyAgent;
        agent = new HttpsProxyAgent(proxyManager.getProxyUrl(proxy));
      }
      
      opts.wsOptions = {
        ...opts.wsOptions,
        agent: agent
      };
      
      log.info("mqtt-connect", `Using proxy: ${proxy.host}:${proxy.port} (${proxy.type})`);
    }
    
    return opts;
  }

  function setupClient() {
    if (client) {
      try { client.removeAllListeners(); } catch (_) {}
      try { client.end(true); } catch (_) {}
    }

    const currentProxy = getNextProxy();
    const clientOptions = buildMqttOptions(currentProxy);
    client = mqtt.connect(mqttUrl, clientOptions);

    client.on("connect", () => {
      reconnectCount = 0;
      log.info("mqtt-connect", "Connected to Facebook MQTT");
      startHeartbeat();
    });

    client.on("reconnect", () => {
      log.info("mqtt-connect", "Reconnecting to MQTT...");
    });

    client.on("close", () => {
      stopHeartbeat();
      log.warn("mqtt-connect", "MQTT connection closed");
      scheduleReconnect("close");
    });

    client.on("offline", () => {
      stopHeartbeat();
      log.warn("mqtt-connect", "MQTT went offline");
      scheduleReconnect("offline");
    });

    client.on("error", (err) => {
      log.error("mqtt-connect", "MQTT error:", err.message || err);
      stopHeartbeat();
      try { client.end(true); } catch (_) {}
      scheduleReconnect("error");
    });

    client.on("disconnect", () => {
      log.warn("mqtt-connect", "MQTT disconnect packet received");
      stopHeartbeat();
      scheduleReconnect("disconnect");
    });
  }

  function scheduleReconnect(reason) {
    if (destroyed || reconnectTimer) return;
    const baseDelay = Math.min(3000 * Math.pow(1.5, reconnectCount), 120000);
    const jitter = Math.floor(Math.random() * 3000);
    const delay = baseDelay + jitter;
    reconnectCount++;
    log.info("mqtt-connect", `[${reason}] Reconnecting in ${Math.round(delay / 1000)}s (attempt ${reconnectCount})`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!destroyed) setupClient();
    }, delay);
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (client && client.connected) {
        client.publish("/orca_presence", JSON.stringify({ make_user_available_when_in_foreground: true }), { qos: 1 });
      }
    }, 4 * 60 * 1000);
  }

  function stopHeartbeat() {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  }

  // Methods attached ONCE to the client object
  client = {
    get connected() { return client && client.connected; },
    
    safeSubscribe: function (topics, callback) {
      if (!client || !client.connected) {
        const err = new Error("MQTT not connected, cannot subscribe to " + JSON.stringify(topics));
        log.warn("mqtt-connect", err.message);
        if (typeof callback === "function") callback(err, null);
        return;
      }
      client.subscribe(topics, { qos: 1 }, callback || (() => {}));
    },

    safePublish: function (topic, message, opts, callback) {
      if (typeof opts === "function") { callback = opts; opts = {}; }
      if (!client || !client.connected) {
        const err = new Error("MQTT not connected, publish dropped for topic: " + topic);
        log.warn("mqtt-connect", err.message);
        if (typeof callback === "function") callback(err);
        return;
      }
      client.publish(topic, message, { qos: 1, ...opts }, callback || (() => {}));
    },

    destroy: function () {
      destroyed = true;
      stopHeartbeat();
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      try { client.end(true); } catch (_) {}
      log.info("mqtt-connect", "Client destroyed");
    },

    reconnectWithProxy: setupClient
  };

  // Initial setup
  setupClient();

  return client;
}

module.exports = { connectMqtt, FACEBOOK_MQTT_URL };
