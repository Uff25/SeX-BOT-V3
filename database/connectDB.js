const fs = require("fs");
const path = require("path");

function ensureGlobals() {
        const rootDir = path.join(__dirname, "..");

        if (!global.GoatBot) {
                const configDevPath = path.join(rootDir, "config.dev.json");
                const configPath = fs.existsSync(configDevPath)
                        ? configDevPath
                        : path.join(rootDir, "config.json");
                const configCommandsDevPath = path.join(rootDir, "configCommands.dev.json");
                const configCommandsPath = fs.existsSync(configCommandsDevPath)
                        ? configCommandsDevPath
                        : path.join(rootDir, "configCommands.json");

                global.GoatBot = {
                        config: JSON.parse(fs.readFileSync(configPath, "utf8")),
                        configCommands: require(configCommandsPath)
                };
        }

        if (!global.utils)
                global.utils = require("../utils.js");

        global.client = global.client || {};
        global.client.database = global.client.database || {};
        for (const key of ["creatingThreadData", "creatingUserData", "creatingDashBoardData", "creatingGlobalData"])
                global.client.database[key] = global.client.database[key] || [];

        global.db = global.db || {};
        for (const key of ["allThreadData", "allUserData", "allDashBoardData", "allGlobalData"])
                global.db[key] = global.db[key] || [];
}

module.exports = async function connectDB(api = null) {
        ensureGlobals();
        return require("./controller/index.js")(api);
};
