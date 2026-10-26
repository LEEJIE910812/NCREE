(() => {
  "use strict";
  const graph = document.querySelector(".plotly-graph-div");
  let ready = false;
  let attempts = 0;
  let resizeTimer;
  let originalCamera;

  function report(type, message) {
    if (window.parent === window) return;
    window.parent.postMessage({ channel: "ncree-ae-viewer", type, message, path: location.pathname }, "*");
  }

  function plotTitle() {
    const text = graph.layout.title?.text || "";
    const separator = text.indexOf(" | ");
    if (separator >= 0 && text.startsWith("t0227_known_cases")) return text.slice(separator + 3);
    return text.startsWith("t0227_known_cases") ? "" : text;
  }

  function animate(args) {
    // Interrupted Plotly playback can reject with no error; real failures still surface.
    window.Plotly.animate(graph, ...args).catch(error => {
      if (error != null) report("error", "Animation playback failed. Reload this view and retry.");
    });
  }

  function fitPlot() {
    const compact = innerWidth < 700;
    const height = Math.max(innerHeight, 590);
    document.body.style.overflow = "hidden";
    document.querySelector(".viewer-shell").style.width = "100%";
    graph.parentElement.style.height = `${height}px`;
    const update = {
      height,
      "title.text": plotTitle(),
      "title.font.size": compact ? 11 : 16,
      margin: { l: compact ? 24 : 30, r: compact ? 6 : 110, t: compact ? 55 : 35, b: 140 },
      "scene.domain": { x: [0, compact ? 1 : 0.82], y: [0.09, 0.98] },
      "legend.x": compact ? 0 : 0.86,
      "legend.y": compact ? 1.12 : 0.98,
      "legend.orientation": compact ? "h" : "v",
      "legend.font.size": compact ? 10 : 12,
      "sliders[0].x": compact ? 0.06 : 0.18,
      "sliders[0].len": compact ? 0.88 : 0.56,
      "sliders[0].y": -0.02,
      "sliders[0].currentvalue.font.size": compact ? 12 : 14,
      "sliders[0].font.size": compact ? 8 : 10,
      "sliders[0].pad.t": 28,
      "updatemenus[0].x": compact ? 0.08 : 0.18,
      "updatemenus[0].y": compact ? -0.312 : -0.215,
    };
    const modebar = graph.querySelector(".modebar-container");
    if (modebar) modebar.style.display = compact ? "none" : "";
    // Only presentation changes; traces, frames, coordinates and filters are retained.
    return window.Plotly.relayout(graph, update);
  }

  function initialize() {
    if (!graph || !window.Plotly) {
      report("error", "The plotting library could not load. Check your connection and retry.");
      return;
    }
    if (!graph._fullLayout || typeof graph.on !== "function") {
      if (++attempts < 600) setTimeout(initialize, 200);
      else report("error", "The plot could not finish initializing.");
      return;
    }
    originalCamera = JSON.parse(JSON.stringify(graph.layout.scene.camera));
    const cameraScale = innerWidth < 700 ? 1.28 : 1.12;
    for (const axis of ["x", "y", "z"]) originalCamera.eye[axis] *= cameraScale;
    const buttons = graph.layout.updatemenus[0].buttons.map(button => button.method === "animate" ? { ...button, method: "skip" } : button);
    const steps = graph.layout.sliders[0].steps.map(step => step.method === "animate" ? { ...step, method: "skip" } : step);
    graph.on("plotly_buttonclicked", event => {
      if (event.button.method === "skip" && event.button.args?.length) animate(event.button.args);
    });
    graph.on("plotly_sliderchange", event => {
      if (event.step.method === "skip" && event.step.args?.length) animate(event.step.args);
    });
    graph.on("plotly_afterplot", () => {
      const title = plotTitle();
      if (title !== graph.layout.title.text) window.Plotly.relayout(graph, { "title.text": title }).catch(() => {});
    });
    window.Plotly.relayout(graph, {
      "scene.camera": JSON.parse(JSON.stringify(originalCamera)),
      "updatemenus[0].buttons": buttons,
      "sliders[0].steps": steps,
    }).then(fitPlot).then(() => {
      ready = true;
      report("ready");
    }).catch(() => report("error", "The plot could not be resized for this display."));
  }

  window.addEventListener("resize", () => {
    if (!ready) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => fitPlot().catch(() => {}), 150);
  });
  window.addEventListener("message", event => {
    if (event.source !== window.parent || event.data?.channel !== "ncree-ae-command" || !ready) return;
    if (event.data.command === "reset-camera") window.Plotly.relayout(graph, { "scene.camera": JSON.parse(JSON.stringify(originalCamera)) });
  });
  if (!graph || !window.Plotly || window.AE_PLOT_READY) initialize();
  else {
    window.addEventListener("ae-plot-ready", initialize, { once: true });
    setTimeout(() => { if (!ready) report("error", "The plot could not finish initializing."); }, 120000);
  }
})();
