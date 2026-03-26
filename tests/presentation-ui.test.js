import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultAppState } from "../js/defaults.js";
import { normalizeSettings } from "../js/model.js";
import { derivePresentationViewModel } from "../js/presentation-ui.js";
import { derivePresentationSnapshot, startSession } from "../js/timer-engine.js";

function createPresentationApp(settingsOverrides = {}, nowMs = 0) {
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
    presentationViewportMode: "compact-portrait",
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
