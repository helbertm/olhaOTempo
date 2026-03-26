import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultAppState } from "../js/defaults.js";
import { updateDocumentTitle } from "../js/ui-config.js";

test("titulo do documento nao duplica o nome do app", () => {
  const previousDocument = globalThis.document;
  const app = {
    state: createDefaultAppState(),
  };
  const elements = {
    sectionsPanelTitle: {
      textContent: "",
    },
  };

  globalThis.document = {
    title: "",
  };

  try {
    app.state.settings.presentationTitle = "De olho no tempo";
    updateDocumentTitle({ app, elements });

    assert.equal(globalThis.document.title, "De olho no tempo");
  } finally {
    globalThis.document = previousDocument;
  }
});

test("titulo do documento inclui o roteiro quando ele difere do nome do app", () => {
  const previousDocument = globalThis.document;
  const app = {
    state: createDefaultAppState(),
  };
  const elements = {
    sectionsPanelTitle: {
      textContent: "",
    },
  };

  globalThis.document = {
    title: "",
  };

  try {
    app.state.settings.presentationTitle = "Keynote anual";
    updateDocumentTitle({ app, elements });

    assert.equal(globalThis.document.title, "Keynote anual · De olho no tempo");
    assert.equal(elements.sectionsPanelTitle.textContent, "Keynote anual - Etapas");
  } finally {
    globalThis.document = previousDocument;
  }
});
