const PONYTUBE_DEFAULTS = {
  ponytubeEnabled: true,
  ponytubeWallpaper: true,
  ponytubeWallpaperOpacity: 100,
  ponytubeLite: false
};

const inputs = Object.fromEntries(
  Object.keys(PONYTUBE_DEFAULTS).map((key) => [key, document.getElementById(key)])
);
const status = document.getElementById("status");
const options = document.getElementById("options");
const opacityRow = document.getElementById("opacityRow");
const opacityValue = document.getElementById("opacityValue");
let saveTimer;

function render(settings) {
  for (const [key, input] of Object.entries(inputs)) {
    if (input.type === "checkbox") {
      input.checked = Boolean(settings[key]);
    } else {
      input.value = settings[key];
    }
  }
  updateState();
}

function readForm() {
  return {
    ponytubeEnabled: inputs.ponytubeEnabled.checked,
    ponytubeWallpaper: inputs.ponytubeWallpaper.checked,
    ponytubeWallpaperOpacity: Number(inputs.ponytubeWallpaperOpacity.value),
    ponytubeLite: inputs.ponytubeLite.checked
  };
}

function updateState() {
  const { ponytubeEnabled, ponytubeWallpaper, ponytubeWallpaperOpacity } = readForm();
  status.textContent = ponytubeEnabled ? "Tema ativo ✨" : "Tema pausado";
  document.body.classList.toggle("is-off", !ponytubeEnabled);
  options.toggleAttribute("inert", !ponytubeEnabled);
  inputs.ponytubeWallpaperOpacity.disabled = !ponytubeWallpaper;
  opacityRow.classList.toggle("is-disabled", !ponytubeWallpaper);
  opacityValue.textContent = `${ponytubeWallpaperOpacity}%`;
}

function save(delay = 0) {
  updateState();
  clearTimeout(saveTimer);
  // chrome.storage.sync has a write quota; debounce slider drags.
  saveTimer = setTimeout(() => chrome.storage.sync.set(readForm()), delay);
}

chrome.storage.sync.get(PONYTUBE_DEFAULTS, render);

for (const input of Object.values(inputs)) {
  if (input.type === "range") {
    input.addEventListener("input", () => save(150));
    input.addEventListener("change", () => save());
  } else {
    input.addEventListener("change", () => save());
  }
}
