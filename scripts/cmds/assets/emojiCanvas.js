"use strict";
// emojiCanvas
//Made by @Azadx69x 

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { loadImage, registerFont } = require("canvas");

const emojiCache = new Map();
const emojiDiskCache = path.join(__dirname, "emoji");
const emojiFallbackFont = path.join(__dirname, "font", "NotoColorEmoji-Regular.ttf");
let emojiFallbackAvailable = false;

try {
  if (fs.existsSync(emojiFallbackFont)) {
    registerFont(emojiFallbackFont, { family: "EmojiFallback" });
    emojiFallbackAvailable = true;
  }
} catch {
  // The SVG renderer below remains the primary renderer if this font is unavailable.
}

const segmenter = typeof Intl.Segmenter === "function"
  ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
  : null;

function splitGraphemes(value) {
  const text = String(value ?? "");
  if (segmenter) return Array.from(segmenter.segment(text), item => item.segment);
  return Array.from(text);
}

function isEmoji(value) {
  return /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{1F1E6}-\u{1F1FF}]/u.test(value)
    || /^\d\uFE0F?\u20E3$/u.test(value)
    || value.includes("\u200D");
}

function getEmojiNames(value) {
  const codePoints = Array.from(value)
    .map(character => character.codePointAt(0).toString(16));
  const names = [codePoints.join("-")];
  const withoutVariationSelector = codePoints.filter(codePoint => codePoint !== "fe0e" && codePoint !== "fe0f");
  if (withoutVariationSelector.length !== codePoints.length) {
    names.push(withoutVariationSelector.join("-"));
  }
  return [...new Set(names)];
}

function getEmojiCachePath(name) {
  return path.join(emojiDiskCache, `${name}.svg`);
}

async function loadEmoji(value) {
  const names = getEmojiNames(value);
  const cacheKey = names[0];
  if (!emojiCache.has(cacheKey)) {
    emojiCache.set(cacheKey, (async () => {
      for (const name of names) {
        const cachePath = getEmojiCachePath(name);
        try {
          if (fs.existsSync(cachePath)) {
            return await loadImage(fs.readFileSync(cachePath));
          }
        } catch {
          // A partially written cache file should not stop the other sources.
        }

        const urls = [
          `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${name}.svg`,
          `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${name}.svg`
        ];
        for (const url of urls) {
          try {
            const response = await axios.get(url, {
              responseType: "text",
              timeout: 5000,
              headers: { "User-Agent": "Mozilla/5.0" }
            });
            const svg = response.data.replace(
              "<svg ",
              '<svg width="128" height="128" '
            );
            try {
              fs.mkdirSync(emojiDiskCache, { recursive: true });
              fs.writeFileSync(cachePath, svg);
            } catch {
              // Disk caching is best-effort; the in-memory image is still usable.
            }
            return await loadImage(Buffer.from(svg));
          } catch {
            // Try the next CDN or the next Twemoji filename variant.
          }
        }
      }
      return null;
    })());
  }
  return emojiCache.get(cacheKey);
}

function fontSizeFrom(font) {
  const match = String(font || "").match(/(\d+(?:\.\d+)?)px/);
  return match ? Number(match[1]) : 16;
}

function emojiTop(y, size, baseline) {
  switch (baseline) {
    case "top":
      return y;
    case "middle":
      return y - size * 0.55;
    case "bottom":
      return y - size;
    default:
      return y - size * 0.82;
  }
}

/**
 * Draws text while replacing emoji graphemes with color SVG assets.
 * node-canvas/Cairo cannot reliably render color emoji fonts, so drawing
 * emoji as images keeps them visible in PNG and GIF output.
 */
async function drawTextWithEmoji(ctx, value, x, y, options = {}) {
  const text = String(value ?? "");
  const graphemes = splitGraphemes(text);
  if (!graphemes.some(isEmoji)) {
    if (Number.isFinite(options.maxWidth)) ctx.fillText(text, x, y, options.maxWidth);
    else ctx.fillText(text, x, y);
    return;
  }

  const font = options.font || ctx.font;
  const fillStyle = options.fillStyle || ctx.fillStyle;
  const textAlign = options.textAlign || ctx.textAlign || "start";
  const textBaseline = options.textBaseline || ctx.textBaseline || "alphabetic";
  const size = options.emojiSize || fontSizeFrom(font);
  const parts = await Promise.all(graphemes.map(async valuePart => ({
    value: valuePart,
    emoji: isEmoji(valuePart),
    image: isEmoji(valuePart) ? await loadEmoji(valuePart) : null
  })));

  const widths = parts.map(part => {
    if (part.emoji && part.image) return size;
    if (part.emoji && emojiFallbackAvailable) {
      ctx.save();
      ctx.font = `${size}px EmojiFallback`;
      const width = Math.max(size, ctx.measureText(part.value).width);
      ctx.restore();
      return width;
    }
    return ctx.measureText(part.value).width;
  });
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const scale = Number.isFinite(options.maxWidth) && totalWidth > options.maxWidth
    ? options.maxWidth / totalWidth
    : 1;
  const renderSize = size * scale;
  const renderFont = scale === 1
    ? font
    : String(font).replace(/(\d+(?:\.\d+)?)px/, `${fontSizeFrom(font) * scale}px`);
  const renderWidths = widths.map(width => width * scale);
  const renderTotalWidth = renderWidths.reduce((sum, width) => sum + width, 0);
  let cursor = x;
  if (textAlign === "center") cursor -= renderTotalWidth / 2;
  else if (textAlign === "right" || textAlign === "end") cursor -= renderTotalWidth;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = textBaseline;
  ctx.fillStyle = fillStyle;
  for (let index = 0; index < parts.length; index++) {
    const part = parts[index];
    const width = renderWidths[index];
    if (part.image) {
      ctx.drawImage(part.image, cursor, emojiTop(y, renderSize, textBaseline), renderSize, renderSize);
    } else {
      if (part.emoji && emojiFallbackAvailable) {
        ctx.font = `${renderSize}px EmojiFallback`;
      } else {
        ctx.font = renderFont;
      }
      ctx.fillText(part.value, cursor, y);
    }
    cursor += width;
  }
  ctx.restore();
}

module.exports = { drawTextWithEmoji };
