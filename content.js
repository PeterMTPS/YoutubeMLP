const PONYTUBE_DEFAULTS = {
  ponytubeEnabled: true,
  ponytubeWallpaper: true,
  ponytubeWallpaperOpacity: 100,
  ponytubeLite: false
};
// Mirror of the settings in the page's localStorage, read synchronously at
// document_start so the theme is applied before the first paint (no flash).
const PONYTUBE_CACHE_KEY = "ponytube:settings";

const root = document.documentElement;
let settings = readCache();
let lastDark = null;

function readCache() {
  try {
    return { ...PONYTUBE_DEFAULTS, ...JSON.parse(localStorage.getItem(PONYTUBE_CACHE_KEY)) };
  } catch {
    return { ...PONYTUBE_DEFAULTS };
  }
}

function writeCache() {
  try {
    localStorage.setItem(PONYTUBE_CACHE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: theme still works, it just may flash on load.
  }
}

function applySettings() {
  root.classList.toggle("ponytube-theme", Boolean(settings.ponytubeEnabled));
  root.classList.toggle("ponytube-no-wallpaper", !settings.ponytubeWallpaper);
  root.classList.toggle("ponytube-lite", Boolean(settings.ponytubeLite));
  root.style.setProperty("--pt-wallpaper-opacity", String(settings.ponytubeWallpaperOpacity / 100));
  syncYoutubeTheme();
}

function syncYoutubeTheme() {
  const dark = root.hasAttribute("dark") || Boolean(document.body?.hasAttribute("dark"));
  if (dark === lastDark) {
    return;
  }
  lastDark = dark;
  root.classList.toggle("ponytube-ytdark", dark);
  root.classList.toggle("ponytube-ytlight", !dark);
}

applySettings();

chrome.storage.sync.get(PONYTUBE_DEFAULTS, (stored) => {
  settings = stored;
  writeCache();
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
    writeCache();
    applySettings();
  }
});

function watchYoutubeTheme() {
  const observer = new MutationObserver(syncYoutubeTheme);
  observer.observe(root, { attributes: true, attributeFilter: ["dark"] });
  observer.observe(document.body, { attributes: true, attributeFilter: ["dark"] });
  syncYoutubeTheme();
}

if (document.body) {
  watchYoutubeTheme();
} else {
  document.addEventListener("DOMContentLoaded", watchYoutubeTheme, { once: true });
}
