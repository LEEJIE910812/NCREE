(() => {
  "use strict";

  let frame = document.getElementById("viewer");
  const stage = document.getElementById("viewer-stage");
  const overlay = document.getElementById("load-overlay");
  const spinner = document.getElementById("spinner");
  const retry = document.getElementById("retry");
  const status = document.getElementById("status");
  const statusText = document.getElementById("status-text");
  const reset = document.getElementById("reset-camera");
  const fullscreen = document.getElementById("fullscreen");
  const open = document.getElementById("open-view");
  const download = document.getElementById("download-view");
  let state = { method: "way1", view: "time" };
  let loadingTimer;

  window.lucide?.createIcons();

  function parseState() {
    const parameters = new URLSearchParams(location.hash.slice(1));
    return {
      method: ["way1", "way3"].includes(parameters.get("method")) ? parameters.get("method") : "way1",
      view: ["time", "depth"].includes(parameters.get("view")) ? parameters.get("view") : "time",
    };
  }

  function viewURL() {
    return new URL(`views/${state.method}/${state.view}.html`, document.baseURI);
  }

  function viewLabel() {
    return `${state.method === "way1" ? "Way1" : "Way3"} / ${state.view === "time" ? "Time" : "Depth"}`;
  }

  function setStatus(value, text) {
    status.dataset.state = value;
    statusText.textContent = text;
  }

  function showError(message) {
    clearTimeout(loadingTimer);
    stage.dataset.ready = "false";
    stage.setAttribute("aria-busy", "false");
    overlay.hidden = false;
    spinner.hidden = true;
    retry.hidden = false;
    reset.disabled = true;
    document.getElementById("load-title").textContent = "View unavailable";
    document.getElementById("load-message").textContent = message;
    setStatus("error", "Unavailable");
  }

  function loadView() {
    clearTimeout(loadingTimer);
    document.querySelectorAll("[data-method]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.method === state.method)));
    document.querySelectorAll("[data-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === state.view)));
    const label = viewLabel();
    document.title = `t0227 ${label} | NCREE`;
    document.getElementById("view-label").textContent = label;
    document.getElementById("load-title").textContent = `Loading ${label}`;
    document.getElementById("load-message").textContent = "Loading experiment data...";
    stage.dataset.ready = "false";
    stage.setAttribute("aria-busy", "true");
    overlay.hidden = false;
    spinner.hidden = false;
    retry.hidden = true;
    reset.disabled = true;
    setStatus("loading", "Loading");
    open.href = viewURL().href;
    download.href = viewURL().href;
    download.download = `t0227-${state.method}-${state.view}.html`;
    const nextFrame = frame.cloneNode(false);
    nextFrame.title = `t0227 ${label} view`;
    nextFrame.src = viewURL().href;
    nextFrame.addEventListener("error", () => showError("The selected view could not be loaded."));
    // A fresh frame releases the old WebGL view without adding child history entries.
    frame.replaceWith(nextFrame);
    frame = nextFrame;
    loadingTimer = setTimeout(() => showError("Loading timed out. Check your connection and retry."), 180000);
  }

  function select(next) {
    const nextState = { ...state, ...next };
    if (nextState.method === state.method && nextState.view === state.view) return;
    const parameters = new URLSearchParams(nextState);
    const hash = `#${parameters}`;
    if (location.hash === hash) return;
    history.pushState(null, "", hash);
    state = parseState();
    loadView();
  }

  document.querySelectorAll("[data-method]").forEach(button => button.addEventListener("click", () => select({ method: button.dataset.method })));
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => select({ view: button.dataset.view })));
  document.getElementById("reload-view").addEventListener("click", loadView);
  retry.addEventListener("click", loadView);
  reset.addEventListener("click", () => frame.contentWindow?.postMessage({ channel: "ncree-ae-command", command: "reset-camera" }, "*"));

  if (!document.fullscreenEnabled) fullscreen.hidden = true;
  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (error) {
      fullscreen.title = "Fullscreen is unavailable in this browser";
    }
  });
  document.addEventListener("fullscreenchange", () => {
    const label = document.fullscreenElement ? "Exit fullscreen" : "Fullscreen";
    fullscreen.title = label;
    fullscreen.setAttribute("aria-label", label);
  });

  window.addEventListener("message", event => {
    const message = event.data;
    if (event.source !== frame.contentWindow || message?.channel !== "ncree-ae-viewer") return;
    if (message.path !== viewURL().pathname) return;
    if (message.type === "error") return showError(message.message || "The plot could not be rendered.");
    if (message.type !== "ready") return;
    clearTimeout(loadingTimer);
    overlay.hidden = true;
    stage.dataset.ready = "true";
    stage.setAttribute("aria-busy", "false");
    reset.disabled = false;
    setStatus("ready", "Ready");
  });

  window.addEventListener("popstate", () => { state = parseState(); loadView(); });
  window.addEventListener("hashchange", () => {
    const next = parseState();
    if (next.method !== state.method || next.view !== state.view) { state = next; loadView(); }
  });
  state = parseState();
  loadView();
})();
