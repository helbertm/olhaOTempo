import assert from "node:assert/strict";
import test from "node:test";

import {
  getBackToTopScrollBehavior,
  getBackToTopThreshold,
  shouldShowBackToTop,
} from "../js/back-to-top.js";

test("limiar do botao topo aparece mais cedo em viewport movel", () => {
  assert.equal(
    getBackToTopThreshold({
      viewportWidth: 390,
      viewportHeight: 844,
    }),
    186,
  );
  assert.equal(
    getBackToTopThreshold({
      viewportWidth: 1280,
      viewportHeight: 1080,
    }),
    270,
  );
});

test("botao topo so aparece no modo edicao apos o limiar", () => {
  assert.equal(
    shouldShowBackToTop({
      view: "edit",
      scrollY: 250,
      viewportWidth: 390,
      viewportHeight: 844,
    }),
    true,
  );
  assert.equal(
    shouldShowBackToTop({
      view: "presentation",
      scrollY: 600,
      viewportWidth: 390,
      viewportHeight: 844,
    }),
    false,
  );
});

test("scroll ao topo respeita reduced motion", () => {
  assert.equal(getBackToTopScrollBehavior(true), "auto");
  assert.equal(getBackToTopScrollBehavior(false), "smooth");
});
