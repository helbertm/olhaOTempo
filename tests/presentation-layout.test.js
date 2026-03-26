import assert from "node:assert/strict";
import test from "node:test";

import { getPresentationViewportMode } from "../js/presentation-layout.js";

function createWindow(width, height) {
  return {
    innerWidth: width,
    innerHeight: height,
  };
}

test("classifica viewport desktop", () => {
  assert.equal(getPresentationViewportMode(createWindow(1440, 1024)), "desktop");
});

test("classifica viewport tablet", () => {
  assert.equal(getPresentationViewportMode(createWindow(1024, 768)), "tablet");
});

test("classifica viewport compacta em retrato", () => {
  assert.equal(getPresentationViewportMode(createWindow(390, 844)), "compact-portrait");
});

test("classifica viewport compacta em paisagem", () => {
  assert.equal(getPresentationViewportMode(createWindow(844, 390)), "compact-landscape");
});

test("prefere visualViewport quando disponivel", () => {
  const windowRef = {
    innerWidth: 1280,
    innerHeight: 800,
    visualViewport: {
      width: 430,
      height: 932,
    },
  };

  assert.equal(getPresentationViewportMode(windowRef), "compact-portrait");
});

test("classifica paisagem compacta usando visualViewport reduzida", () => {
  const windowRef = {
    innerWidth: 932,
    innerHeight: 430,
    visualViewport: {
      width: 812,
      height: 343,
    },
  };

  assert.equal(getPresentationViewportMode(windowRef), "compact-landscape");
});
