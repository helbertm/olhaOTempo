import assert from "node:assert/strict";
import test from "node:test";

import {
  isElementInViewport,
  shouldShowQuickStart,
} from "../js/floating-actions.js";

test("atalho de apresentar aparece apenas no modo edicao sem CTA inline visivel", () => {
  assert.equal(
    shouldShowQuickStart({
      view: "edit",
      inlineActionVisible: false,
    }),
    true,
  );
  assert.equal(
    shouldShowQuickStart({
      view: "edit",
      inlineActionVisible: true,
    }),
    false,
  );
  assert.equal(
    shouldShowQuickStart({
      view: "presentation",
      inlineActionVisible: false,
    }),
    false,
  );
});

test("visibilidade do CTA inline respeita intersecao real da viewport", () => {
  const visibleElement = {
    getBoundingClientRect() {
      return {
        top: 120,
        right: 280,
        bottom: 168,
        left: 24,
        width: 256,
        height: 48,
      };
    },
  };
  const hiddenElement = {
    getBoundingClientRect() {
      return {
        top: 920,
        right: 280,
        bottom: 968,
        left: 24,
        width: 256,
        height: 48,
      };
    },
  };

  assert.equal(
    isElementInViewport(visibleElement, {
      viewportWidth: 390,
      viewportHeight: 844,
    }),
    true,
  );
  assert.equal(
    isElementInViewport(hiddenElement, {
      viewportWidth: 390,
      viewportHeight: 844,
    }),
    false,
  );
});
