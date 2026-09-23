"use strict";

const { Server } = require("socket.io");
const { log, getText } = global.utils;
const { config } = global.GoatBot;
const proxyManager = require('./x69x-Proxy.js');

const PING_INTERVAL_MS = 25000;
const STATUS_BROADCAST_INTERVAL = 30000;

module.exports = async function (server) {
  const { channelName, verifyToken } = config.serverUptime?.socket || {};

  if (!channelName) return log.err("SOCKET IO", '"channelName" is not defined in config');
  if (!verifyToken) return log.err("SOCKET IO", '"verifyToken" is not defined in config');

  const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    pingInterval: PING_INTERVAL_MS,
    pingTimeout: 15000,
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  log.info("SOCKET IO", getText("socketIO", "connected"));

  io.use((socket, next) => {
    const token = socket.handshake.query?.verifyToken || socket.handshake.auth?.token;
    if (token !== verifyToken) {
      return next(new Error("Invalid verify token"));
    }
    next();
  });

  function getBotStatus() {
    const uptime = process.uptime();
    const mem = process.memoryUsage();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    return {
      status: global.statusAccountBot || "unknown",
      uptime: uptime,
      uptimeStr: uptimeStr,
      memoryMB: Math.round(mem.rss / 1024 / 1024),
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: Date.now(),
      connectedClients: io.engine?.clientsCount || 0,
    };
  }

  function safeEmit(socket, event, data) {
    try { socket.emit(event, data); } catch (_) {}
  }

  function broadcastStatus() {
    io.to("authenticated").emit(channelName, {
      type: "status",
      ...getBotStatus(),
    });
  }

  const broadcastInterval = setInterval(broadcastStatus, STATUS_BROADCAST_INTERVAL);

  if (broadcastInterval.unref) broadcastInterval.unref();

  io.on("connection", (socket) => {
    log.info("SOCKET IO", `New client connected: ${socket.id}`);

    socket.join("authenticated");

    safeEmit(socket, channelName, {
      type: "connected",
      message: "Connected to X69X BOT V3 socket server",
      ...getBotStatus(),
    });

    socket.on("ping", (data) => {
      safeEmit(socket, "pong", { ts: Date.now(), echo: data });
    });

    socket.on("getStatus", () => {
      safeEmit(socket, channelName, { type: "status", ...getBotStatus() });
    });

    socket.on("getUptime", () => {
      safeEmit(socket, channelName, {
        type: "uptime",
        uptime: process.uptime(),
        unit: "seconds",
      });
    });

    socket.on("restartBot", () => {
      log.warn("SOCKET IO", `Restart requested by socket client ${socket.id}`);
      safeEmit(socket, channelName, { type: "restarting", message: "Bot is restarting..." });

      io.to("authenticated").emit(channelName, { type: "restarting" });
      setTimeout(() => process.exit(0), 1000);
    });

    socket.on("disconnect", (reason) => {
      socket.leave("authenticated");
      log.info("SOCKET IO", `Client disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on("error", (err) => {
      log.warn("SOCKET IO", `Socket error for ${socket.id}:`, err?.message || err);
    });
  });

  process.once("SIGTERM", () => { clearInterval(broadcastInterval); io.close(); });
  process.once("SIGINT", () => { clearInterval(broadcastInterval); io.close(); });

  return io;
};
