import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultAppState } from "../js/defaults.js";
import { normalizeSettings } from "../js/model.js";
import { derivePresentationViewModel } from "../js/presentation-ui.js";
import { derivePresentationSnapshot, startSession } from "../js/timer-engine.js";

function createSection(id, title, durationSeconds) {
  return {
    id,
    title,
    durationSeconds,
    alerts: [],
  };
}

function createPresentationApp(settingsOverrides = {}, nowMs = 0, viewportMode = "compact-portrait") {
  const state = createDefaultAppState();

  state.settings = normalizeSettings({
    ...state.settings,
    ...settingsOverrides,
  });
  state.runtime.session = startSession(0);

  return {
    state,
    fullscreenState: {
      active: false,
      requestSupported: true,
      standalone: false,
      installHint: null,
    },
    wakeLockState: {
      active: false,
      supported: true,
      shouldPersist: false,
    },
    presentationViewportMode: viewportMode,
    presentationRenderCache: {
      structureKey: "",
      sectionTimerText: "",
      totalTimerText: "",
      overtimeText: "",
      alertKey: "",
    },
    lastRenderedSectionId: null,
    lastOvertimeState: false,
    nowMs,
  };
}

test("view model usa layout dual durante etapas intermediarias", () => {
  const app = createPresentationApp();
  const snapshot = derivePresentationSnapshot(app.state.settings, app.state.runtime.session, 60_000);
  const viewModel = derivePresentationViewModel({ app, snapshot });

  assert.equal(viewModel.layoutMode, "dual");
  assert.equal(viewModel.showGlobalTimer, true);
  assert.equal(viewModel.controls.showPause, true);
  assert.equal(viewModel.controls.layout, "compact-grid");
});

test("view model oculta timer global na ultima etapa", () => {
  const app = createPresentationApp();
  const lastSectionStartMs = (300 + 540) * 1000;
  const snapshot = derivePresentationSnapshot(
    app.state.settings,
    app.state.runtime.session,
    lastSectionStartMs,
  );
  const viewModel = derivePresentationViewModel({ app, snapshot });

  assert.equal(viewModel.layoutMode, "single");
  assert.equal(viewModel.showGlobalTimer, false);
});

test("view model usa layout dividido em paisagem compacta", () => {
  const app = createPresentationApp({}, 0, "compact-landscape");
  const snapshot = derivePresentationSnapshot(app.state.settings, app.state.runtime.session, 0);
  const viewModel = derivePresentationViewModel({ app, snapshot });

  assert.equal(viewModel.contentLayout, "split");
  assert.equal(viewModel.controls.layout, "compact-inline");
});

test("view model reduz densidade para titulo longo em retrato compacto", () => {
  const app = createPresentationApp({
    sections: [
      createSection("section-1", "Abertura da demonstração principal", 300),
      createSection("section-2", "Perguntas finais e encaminhamentos", 240),
    ],
  });
  const snapshot = derivePresentationSnapshot(app.state.settings, app.state.runtime.session, 0);
  const viewModel = derivePresentationViewModel({ app, snapshot });

  assert.equal(viewModel.titleDensity, "tight");
  assert.match(viewModel.headerText, /Abertura/);
});

test("view model respeita combinacao de etapa atual e proxima", () => {
  const app = createPresentationApp({
    showCurrentSection: false,
    showNextSection: true,
  });
  const snapshot = derivePresentationSnapshot(app.state.settings, app.state.runtime.session, 0);
  const viewModel = derivePresentationViewModel({ app, snapshot });

  assert.equal(viewModel.headerText, "Demonstração principal");
  assert.equal(viewModel.showHeader, true);
});

test("view model remove layout dividido quando entra em overtime", () => {
  const app = createPresentationApp({}, 0, "compact-landscape");
  const totalMs = (300 + 540 + 180) * 1000 + 1_000;
  const snapshot = derivePresentationSnapshot(app.state.settings, app.state.runtime.session, totalMs);
  const viewModel = derivePresentationViewModel({ app, snapshot });

  assert.equal(viewModel.showOvertime, true);
  assert.equal(viewModel.contentLayout, "stacked");
});
