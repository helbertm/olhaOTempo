import assert from "node:assert/strict";
import test from "node:test";

import { FullscreenController, getFullscreenState } from "../js/capabilities.js";

function createDocument(overrides = {}) {
  return {
    fullscreenEnabled: false,
    webkitFullscreenEnabled: false,
    fullscreenElement: null,
    webkitFullscreenElement: null,
    addEventListener() {},
    exitFullscreen() {
      this.fullscreenElement = null;
      return Promise.resolve();
    },
    ...overrides,
  };
}

function createWindow(displayMode = "browser") {
  return {
    matchMedia(query) {
      if (query === "(display-mode: standalone)") {
        return { matches: displayMode === "standalone" };
      }

      if (query === "(display-mode: fullscreen)") {
        return { matches: displayMode === "fullscreen" };
      }

      return { matches: false };
    },
  };
}

test("sinaliza instalacao pela tela inicial em dispositivos Apple sem Fullscreen API", () => {
  const state = getFullscreenState({
    documentRef: createDocument(),
    windowRef: createWindow(),
    navigatorRef: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      platform: "iPhone",
      maxTouchPoints: 5,
      standalone: false,
    },
  });

  assert.equal(state.supported, false);
  assert.equal(state.active, false);
  assert.equal(state.requestSupported, false);
  assert.equal(state.standalone, false);
  assert.equal(state.installHint, "ios-home-screen");
});

test("trata app instalado como estado ativo mesmo sem Fullscreen API", () => {
  const state = getFullscreenState({
    documentRef: createDocument(),
    windowRef: createWindow("standalone"),
    navigatorRef: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      platform: "iPhone",
      maxTouchPoints: 5,
      standalone: true,
    },
  });

  assert.equal(state.supported, true);
  assert.equal(state.active, true);
  assert.equal(state.requestSupported, false);
  assert.equal(state.standalone, true);
  assert.equal(state.installHint, null);
});

test("retorna install-required ao pedir fullscreen no iPhone sem suporte nativo", async () => {
  const controller = new FullscreenController({
    documentRef: createDocument(),
    windowRef: createWindow(),
    navigatorRef: {
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
      platform: "iPhone",
      maxTouchPoints: 5,
      standalone: false,
    },
  });

  const result = await controller.enter({
    requestFullscreen() {
      return Promise.resolve();
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, "install-required");
});
