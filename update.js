const { execFileSync } = require("child_process");
const path = require("path");

try {
	execFileSync(process.execPath, [path.join(__dirname, "updater.js")], {
		stdio: "inherit",
		cwd: __dirname,
		env: process.env
	});
} catch (e) {
	process.exit(e.status || 1);
}
