/* global PonyPalette */

const PONYTUBE_DEFAULTS = {
  ponytubeEnabled: true,
  ponytubeWallpaper: false,
  ponytubeWallpaperOpacity: 30
};

// Both caches live in the page's localStorage so they can be read
// synchronously at document_start, before YouTube paints anything.
const SETTINGS_KEY = "ponytube:settings";
const PALETTE_KEY = "ponytube:palette";
const PALETTE_VERSION = 2; // bump when palette.js changes

const root = document.documentElement;
let settings = { ...PONYTUBE_DEFAULTS, ...readJson(SETTINGS_KEY) };
let paletteStyle = null;

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the theme still works, just without the cache.
  }
}

function setPaletteCss(css) {
  if (!paletteStyle) {
    paletteStyle = document.createElement("style");
    paletteStyle.id = "ponytube-palette";
    root.append(paletteStyle);
  }
  if (paletteStyle.textContent !== css) {
    paletteStyle.textContent = css;
  }
}

function applySettings() {
  const on = Boolean(settings.ponytubeEnabled);
  root.classList.toggle("ponytube-theme", on);
  root.classList.toggle("ponytube-wallpaper", on && Boolean(settings.ponytubeWallpaper));
  root.style.setProperty("--pt-wallpaper-opacity", String(settings.ponytubeWallpaperOpacity / 100));
  if (paletteStyle) {
    paletteStyle.media = on ? "all" : "not all";
  }
}

// 1. Instant paint from cache.
const cachedPalette = readJson(PALETTE_KEY);
if (cachedPalette.version === PALETTE_VERSION && cachedPalette.css) {
  setPaletteCss(cachedPalette.css);
}
applySettings();

// 2. Rebuild the palette only when YouTube ships new stylesheets.
function currentSheetHrefs() {
  return [...document.querySelectorAll('link[rel="stylesheet"][href]')].map((l) => l.href);
}

function paletteIsFresh() {
  if (cachedPalette.version !== PALETTE_VERSION || !cachedPalette.css) {
    return false;
  }
  const hrefs = new Set(currentSheetHrefs());
  return cachedPalette.sources.every((src) => src === "inline" || hrefs.has(src));
}

function refreshPalette() {
  if (paletteIsFresh()) {
    return;
  }
  const result = PonyPalette.generate();
  if (!result) {
    return;
  }
  setPaletteCss(result.css);
  applySettings();
  writeJson(PALETTE_KEY, { version: PALETTE_VERSION, ...result });
}

function whenIdle(fn) {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(fn, { timeout: 2000 });
  } else {
    setTimeout(fn, 200);
  }
}

if (!paletteStyle) {
  // First visit: build as soon as the stylesheets are parsed.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshPalette, { once: true });
  } else {
    refreshPalette();
  }
}
// Later visits: verify the cache quietly once the page has settled.
if (document.readyState === "complete") {
  whenIdle(refreshPalette);
} else {
  window.addEventListener("load", () => whenIdle(refreshPalette), { once: true });
}

// 3. Settings from the popup.
chrome.storage.sync.get(PONYTUBE_DEFAULTS, (stored) => {
  settings = stored;
  writeJson(SETTINGS_KEY, settings);
  applySettings();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync") {
    return;
  }
  let changed = false;
  for (const key of Object.keys(PONYTUBE_DEFAULTS)) {
    if (changes[key]) {
      settings[key] = changes[key].newValue ?? PONYTUBE_DEFAULTS[key];
      changed = true;
    }
  }
  if (changed) {
    writeJson(SETTINGS_KEY, settings);
    applySettings();
  }
});
