const PONYTUBE_STORAGE_KEY = "ponytubeEnabled";
const root = document.documentElement;
const wallpaperUrl = chrome.runtime.getURL("assets/background.png");
let darkObserver;

root.style.setProperty("--pt-wallpaper-url", `url("${wallpaperUrl}")`);

function setTheme(enabled) {
  root.classList.toggle("ponytube-theme", Boolean(enabled));
  syncYoutubeTheme();
}

function isYoutubeDark() {
  return root.hasAttribute("dark") || document.body?.hasAttribute("dark");
}

function syncYoutubeTheme() {
  root.classList.toggle("ponytube-ytdark", isYoutubeDark());
  root.classList.toggle("ponytube-ytlight", !isYoutubeDark());
}

chrome.storage.sync.get({ [PONYTUBE_STORAGE_KEY]: true }, (settings) => {
  setTheme(settings[PONYTUBE_STORAGE_KEY]);
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "sync" || !changes[PONYTUBE_STORAGE_KEY]) {
    return;
  }

  setTheme(changes[PONYTUBE_STORAGE_KEY].newValue);
});

function watchYoutubeTheme() {
  if (darkObserver) {
    return;
  }

  darkObserver = new MutationObserver(syncYoutubeTheme);
  darkObserver.observe(root, { attributes: true, attributeFilter: ["dark"] });

  if (document.body) {
    darkObserver.observe(document.body, { attributes: true, attributeFilter: ["dark"] });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    syncYoutubeTheme();
    watchYoutubeTheme();
  });
} else {
  syncYoutubeTheme();
  watchYoutubeTheme();
}
