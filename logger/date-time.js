"use strict";

// Small Moment-compatible formatter for the date formats used by the bot.
// Keeping this local avoids making startup depend on moment-timezone being
// present when a Render install is incomplete.

const DEFAULT_TIME_ZONE = "Asia/Dhaka";

function getDateParts(date, timeZone) {
        const formatter = new Intl.DateTimeFormat("en-US", {
                timeZone: timeZone || DEFAULT_TIME_ZONE,
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
        });
        const parts = {};
        for (const part of formatter.formatToParts(date)) {
                if (part.type !== "literal") parts[part.type] = part.value;
        }

        // Some runtimes represent midnight as 24:xx with hour12:false.
        if (parts.hour === "24") parts.hour = "00";

        const hour = Number(parts.hour);
        return {
                year: parts.year,
                month: parts.month,
                day: parts.day,
                hour: parts.hour,
                minute: parts.minute,
                second: parts.second,
                hour12: String(hour % 12 || 12).padStart(2, "0"),
                meridiem: hour >= 12 ? "PM" : "AM",
                monthName: new Intl.DateTimeFormat("en-US", {
                        timeZone: timeZone || DEFAULT_TIME_ZONE,
                        month: "short",
                }).format(date),
        };
}

function formatDate(date, timeZone, format) {
        if (!format) return date.toISOString();

        const p = getDateParts(date, timeZone);
        const tokens = {
                YYYY: p.year,
                YY: p.year.slice(-2),
                MMM: p.monthName,
                MM: p.month,
                DD: p.day,
                HH: p.hour,
                hh: p.hour12,
                mm: p.minute,
                ss: p.second,
                A: p.meridiem,
        };

        return String(format).replace(/YYYY|YY|MMM|MM|DD|HH|hh|mm|ss|A/g, token => tokens[token]);
}

function makeMoment(value, timeZone) {
        const date = value == null ? new Date() : new Date(value);
        return {
                tz(zone) {
                        return makeMoment(date, zone);
                },
                format(pattern) {
                        return formatDate(date, timeZone, pattern);
                },
                toDate() {
                        return new Date(date);
                },
        };
}

function moment(value) {
        return makeMoment(value);
}

moment.tz = function (value, timeZone) {
        // Moment treats a single IANA-zone string as "now in this zone".
        if (timeZone === undefined && typeof value === "string" && value.includes("/")) {
                return makeMoment(undefined, value);
        }
        return makeMoment(value, timeZone);
};

module.exports = moment;
