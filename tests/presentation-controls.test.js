import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultAppState } from "../js/defaults.js";
import { openPresentationMode } from "../js/presentation-controls.js";

test("abrir modo apresentacao exibe lembrete de versao beta", async () => {
  const app = {
    state: createDefaultAppState(),
  };
  const calls = [];

  app.state.settings.autoStartOnOpen = false;
  app.state.settings.autoFullscreen = false;

  await openPresentationMode({
    app,
    setView(view) {
      calls.push(["setView", view]);
    },
    renderPresentation() {
      calls.push(["renderPresentation"]);
    },
    startPresentationSession() {
      calls.push(["startPresentationSession"]);
    },
    async ensurePresentationFullscreen() {
      calls.push(["ensurePresentationFullscreen"]);
    },
    showToast(message) {
      calls.push(["showToast", message]);
    },
  });

  assert.deepEqual(calls[0], ["setView", "presentation"]);
  assert.deepEqual(calls[1], ["renderPresentation"]);
  assert.deepEqual(calls[2], [
    "showToast",
    "Versão beta: valide fullscreen, wake lock e timers no seu dispositivo antes de usar em palco.",
  ]);
});
