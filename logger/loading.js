"use strict";
const { colors } = require('./colors.js');
const moment     = require("./date-time.js");

const TZ  = "Asia/Ho_Chi_Minh";
const SEP = colors.gray(" ┃ ");
const ARR = colors.gray(" › ");

function ts() {
        return colors.gray(moment().tz(TZ).format("HH:mm:ss DD/MM/YY"));
}

const LEVELS = {
        info:    { icon: "ℹ", label: "INFO ", fn: s => colors.cyanBright(s)    },
        warn:    { icon: "⚠", label: "WARN ", fn: s => colors.yellowBright(s)  },
        err:     { icon: "✖", label: "ERROR", fn: s => colors.redBright(s)     },
        error:   { icon: "✖", label: "ERROR", fn: s => colors.redBright(s)     },
        success: { icon: "✔", label: "OK   ", fn: s => colors.greenBright(s)   },
        master:  { icon: "◆", label: "BOT  ", fn: s => colors.hex("#FF9500")(s)},
};

function badge(level) {
        const d = LEVELS[level] || { icon: "·", label: (level || "LOG").slice(0, 5).padEnd(5), fn: s => s };
        return d.fn(`${d.icon} ${d.label}`);
}

function padCat(s, n = 16) {
        s = String(s || "").trim();
        const padded = s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n);
        return colors.bold.white(padded);
}

function row(level, prefix, msg) {
        const m = (msg == null) ? "" : " " + String(msg);
        return `${ts()}${SEP}${badge(level)}${SEP}${padCat(prefix)}${ARR}${m}`;
}

function write(str) {
        process.stderr.write("\r" + str);
}

function logError(prefix, message) {
        if (message === undefined) { message = prefix; prefix = "ERROR"; }
        write(row("err", prefix, message));
}

module.exports = {
        err:   logError,
        error: logError,

        warn(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "WARN"; }
                write(row("warn", prefix, message));
        },

        info(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "INFO"; }
                write(row("info", prefix, message));
        },

        success(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "SUCCESS"; }
                write(row("success", prefix, message));
        },

        master(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "BOT"; }
                write(row("master", prefix, message));
        },
};
