const PONYTUBE_STORAGE_KEY = "ponytubeEnabled";
const enabledInput = document.querySelector("#enabled");
const labelText = document.querySelector(".label-text");

function render(enabled) {
  enabledInput.checked = enabled;
  labelText.textContent = enabled ? "Tema ativo" : "Tema pausado";
}

chrome.storage.sync.get({ [PONYTUBE_STORAGE_KEY]: true }, (settings) => {
  render(settings[PONYTUBE_STORAGE_KEY]);
});

enabledInput.addEventListener("change", () => {
  chrome.storage.sync.set({
    [PONYTUBE_STORAGE_KEY]: enabledInput.checked
  });

  render(enabledInput.checked);
});
