"use strict";

/**
 * Fast MongoDB connect.
 *
 * Keeps only options that mongoose 6's bundled mongodb driver (4.17.x)
 * accepts, and keeps them conservative. The reference X69X-BOT-V3 build
 * connects with a plain `mongoose.connect(uri)`; this adds just enough
 * tuning to fail fast without changing how the driver reaches Atlas.
 *
 * The driver throws
 *   MongoParseError: option X is not supported
 * for any option it does not know, which stops the bot at startup, so
 * nothing outside the verified set below may be added here.
 */

module.exports = async function (uriConnect) {
	const mongoose = require("mongoose");
	const startTime = Date.now();

	// Mongoose 7+ enables strictQuery by default and it logs a warning on
	// models that declare non-schema query fields. Keep the old behaviour.
	try { mongoose.set("strictQuery", false); } catch (_) {}

	// Reuse an existing connection instead of opening a second one. The bot
	// can hit this path more than once (reload, auto-relogin) and a second
	// connect is the slowest possible outcome.
	if (mongoose.connection && mongoose.connection.readyState === 1) {
		const threadModel = require("../models/mongodb/thread.js");
		const userModel = require("../models/mongodb/user.js");
		const dashBoardModel = require("../models/mongodb/userDashBoard.js");
		const globalModel = require("../models/mongodb/global.js");
		return { threadModel, userModel, dashBoardModel, globalModel };
	}

	// The project runs mongoose 6, which bundles mongodb driver 4.17.x. That
	// driver validates every option and throws
	//   MongoParseError: option X is not supported
	// for anything it does not know, so this list must stay strictly within
	// what driver 4.17 accepts.
	//
	// Deliberately NOT set:
	//   family  - on a mongodb+srv:// URI driver 4.17 resolves the SRV record
	//             with this family pinned, and IPv4-only SRV resolution stalls
	//             here instead of falling back. The working reference build
	//             passes no family at all, so neither do we.
	//   readPreference / retryWrites / heartbeatFrequencyMS /
	//   serverSelectionTryOnce - either unsupported by driver 4.17 or only
	//             relevant to newer drivers.
	const options = {
		// Give up fast instead of hanging the whole login on a bad node.
		serverSelectionTimeoutMS: 8000,
		connectTimeoutMS: 8000,
		socketTimeoutMS: 20000,
		// A small pool is plenty for a chat bot and opens faster than the default.
		maxPoolSize: 10,
		minPoolSize: 0,
		// Do not block startup on an index build.
		autoIndex: false,
	};

	try {
		await mongoose.connect(uriConnect, options);
	}
	catch (err) {
		// A DNS/network hiccup on the SRV record is the usual first failure.
		// One quick retry with the same options is far better than making the
		// user redeploy.
		const message = String(err && (err.message || err));
		if (/MongoParseError|not supported/i.test(message)) throw err;
		const retryable = /ServerSelection|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|querySrv|MongooseServerSelectionError/i.test(message);
		if (!retryable) throw err;
		await new Promise((resolve) => setTimeout(resolve, 1000));
		await mongoose.connect(uriConnect, options);
	}

	const threadModel = require("../models/mongodb/thread.js");
	const userModel = require("../models/mongodb/user.js");
	const dashBoardModel = require("../models/mongodb/userDashBoard.js");
	const globalModel = require("../models/mongodb/global.js");

	if (process.env.DEBUG_MONGODB === "true") {
		console.log(`[MONGODB] connected in ${Date.now() - startTime}ms`);
	}

	return {
		threadModel,
		userModel,
		dashBoardModel,
		globalModel
	};
};
