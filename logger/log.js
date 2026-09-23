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
        info:    { icon: "ℹ", label: "INFO ", fn: s => colors.cyanBright(s)             },
        warn:    { icon: "⚠", label: "WARN ", fn: s => colors.yellowBright(s)            },
        err:     { icon: "✖", label: "ERROR", fn: s => colors.redBright(s)               },
        error:   { icon: "✖", label: "ERROR", fn: s => colors.redBright(s)               },
        success: { icon: "✔", label: "OK   ", fn: s => colors.greenBright(s)             },
        master:  { icon: "◆", label: "BOT  ", fn: s => colors.hex("#FF9500")(s)          },
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

function fmtVal(v) {
        if (v == null) return "";
        if (typeof v === "object") {
                try {
                        const str = v.stack || JSON.stringify(v, null, 2);
                        return "\n  " + colors.gray(str.replace(/\n/g, "\n  "));
                } catch(_) { return " " + String(v); }
        }
        return " " + String(v);
}

function row(level, prefix, msg) {
        return `${ts()}${SEP}${badge(level)}${SEP}${padCat(prefix)}${ARR}${fmtVal(msg)}`;
}

function logError(prefix, message) {
        if (message === undefined) { message = prefix; prefix = "ERROR"; }
        console.log(row("err", prefix, message));
        const extra = Array.from(arguments).slice(2);
        for (const e of extra) {
                if (e == null) continue;
                const s = (typeof e === "object") ? (e.stack || JSON.stringify(e, null, 2)) : String(e);
                console.log("  " + colors.gray(s));
        }
}

module.exports = {
        err:   logError,
        error: logError,

        warn(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "WARN"; }
                console.log(row("warn", prefix, message));
        },

        info(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "INFO"; }
                console.log(row("info", prefix, message));
        },

        success(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "SUCCESS"; }
                console.log(row("success", prefix, message));
        },

        master(prefix, message) {
                if (message === undefined) { message = prefix; prefix = "BOT"; }
                console.log(row("master", prefix, message));
        },

        dev(...args) {
                if (!["development", "production"].includes(process.env.NODE_ENV)) return;
                try { throw new Error(); } catch(e) {
                        let at  = e.stack.split("\n")[2] || "";
                        let pos = at.slice(at.indexOf(process.cwd()) + process.cwd().length + 1);
                        if (pos.endsWith(")")) pos = pos.slice(0, -1);
                        console.log(colors.cyanBright("◎") + " " + colors.gray(pos + " →"), ...args);
                }
        },
};
