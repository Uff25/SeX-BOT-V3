const fs = require("fs-extra");
const readline = require("readline");
const path = require("path");
const log = require('./logger/log.js');

let versionBackup;
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

const backupsRoot = path.join(process.cwd(), "backups");

function recursiveReadDirAndBackup(relPath) {
	const src = path.join(backupsRoot, versionBackup, relPath);
	const dest = path.join(process.cwd(), relPath);

	if (!fs.existsSync(src)) {
		log.warn("RESTORE", `Source not found, skipping: ${src}`);
		return;
	}

	if (fs.lstatSync(src).isDirectory()) {
		if (!fs.existsSync(dest))
			fs.mkdirSync(dest, { recursive: true });
		const entries = fs.readdirSync(src);
		for (const entry of entries)
			recursiveReadDirAndBackup(path.join(relPath, entry));
	} else {
		fs.copyFileSync(src, dest);
		log.info("RESTORE", `Restored: ${relPath}`);
	}
}

(async () => {
	if (process.argv.length < 3) {
		versionBackup = await new Promise((resolve) => {
			rl.question("Input version backup (e.g. 3.0.0 or backup_3.0.0): ", answer => {
				rl.close();
				resolve(answer.trim());
			});
		});
	} else {
		versionBackup = process.argv[2].trim();
		rl.close();
	}

	if (!versionBackup) {
		log.error("ERROR", "Please input a version backup.");
		process.exit(1);
	}

	versionBackup = versionBackup.replace(/^backup_/, "");
	versionBackup = `backup_${versionBackup}`;

	const backupFolder = path.join(backupsRoot, versionBackup);
	if (!fs.existsSync(backupFolder)) {
		log.error("ERROR", `Backup folder does not exist: ${backupFolder}`);
		log.info("INFO", `Available backups: ${
			fs.existsSync(backupsRoot)
				? fs.readdirSync(backupsRoot).filter(f => f.startsWith("backup_")).join(", ") || "none"
				: "backups/ folder not found"
		}`);
		process.exit(1);
	}

	const files = fs.readdirSync(backupFolder);
	if (files.length === 0) {
		log.error("ERROR", `Backup folder is empty: ${backupFolder}`);
		process.exit(1);
	}

	log.info("RESTORE", `Restoring from: ${backupFolder}`);
	for (const file of files)
		recursiveReadDirAndBackup(file);

	try {
		const packageJson = require(`${process.cwd()}/package.json`);
		packageJson.version = versionBackup.replace("backup_", "");
		fs.writeFileSync(`${process.cwd()}/package.json`, JSON.stringify(packageJson, null, 2));
	} catch (e) {
		log.warn("RESTORE", `Could not update package.json version: ${e.message}`);
	}

	log.info("SUCCESS", `Restore backup ${versionBackup} completed successfully.`);
	process.exit(0);
})();
