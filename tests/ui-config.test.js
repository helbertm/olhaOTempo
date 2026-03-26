import assert from "node:assert/strict";
import test from "node:test";

import { createDefaultAppState } from "../js/defaults.js";
import {
  renderConfig,
  updateDocumentTitle,
} from "../js/ui-config.js";

class FakeClassList {
  constructor() {
    this.tokens = new Set();
  }

  add(...tokens) {
    for (const token of tokens) {
      this.tokens.add(token);
    }
  }

  remove(...tokens) {
    for (const token of tokens) {
      this.tokens.delete(token);
    }
  }

  toggle(token, force) {
    if (force === true) {
      this.tokens.add(token);
      return true;
    }

    if (force === false) {
      this.tokens.delete(token);
      return false;
    }

    if (this.tokens.has(token)) {
      this.tokens.delete(token);
      return false;
    }

    this.tokens.add(token);
    return true;
  }

  contains(token) {
    return this.tokens.has(token);
  }
}

class FakeNode {
  constructor() {
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.open = false;
    this.dataset = {};
    this.className = "";
    this.classList = new FakeClassList();
    this.children = [];
    this.queryMap = new Map();
    this.queryAllMap = new Map();
  }

  querySelector(selector) {
    return this.queryMap.get(selector) ?? null;
  }

  querySelectorAll(selector) {
    return this.queryAllMap.get(selector) ?? [];
  }

  replaceChildren(...nodes) {
    this.children = nodes.map((node) => node.root ?? node);
    this.queryAllMap.set(".section-card", this.children);
  }

  append(...nodes) {
    this.children.push(...nodes.map((node) => node.root ?? node));
  }

  setAttribute(name, value) {
    this[name] = value;
  }
}

class FakeFragment {
  constructor(root, queryMap) {
    this.root = root;
    this.queryMap = queryMap;
  }

  querySelector(selector) {
    return this.queryMap.get(selector) ?? null;
  }
}

function createSectionTemplateFragment() {
  const card = new FakeNode();
  const titleInput = new FakeNode();
  const sectionMinutesInput = new FakeNode();
  const sectionSecondsInput = new FakeNode();
  const sectionOrder = new FakeNode();
  const sectionDurationPreview = new FakeNode();
  const addAlertButton = new FakeNode();
  const moveUpButton = new FakeNode();
  const moveDownButton = new FakeNode();
  const removeSectionButton = new FakeNode();
  const alertsDisclosure = new FakeNode();
  const alertsSummaryMeta = new FakeNode();
  const alertList = new FakeNode();
  const sectionWarning = new FakeNode();

  card.queryMap.set(".alerts-disclosure", alertsDisclosure);

  return new FakeFragment(card, new Map([
    [".section-card", card],
    [".section-title-input", titleInput],
    [".section-minutes-input", sectionMinutesInput],
    [".section-seconds-input", sectionSecondsInput],
    [".section-order", sectionOrder],
    [".section-duration-preview", sectionDurationPreview],
    [".add-alert-button", addAlertButton],
    [".move-up-button", moveUpButton],
    [".move-down-button", moveDownButton],
    [".remove-section-button", removeSectionButton],
    [".alerts-disclosure", alertsDisclosure],
    [".alerts-summary-meta", alertsSummaryMeta],
    [".alert-list", alertList],
    [".section-warning", sectionWarning],
  ]));
}

function createAlertTemplateFragment() {
  const row = new FakeNode();
  const alertMinutesInput = new FakeNode();
  const alertSecondsInput = new FakeNode();
  const alertDurationInput = new FakeNode();
  const alertColorInput = new FakeNode();

  return new FakeFragment(row, new Map([
    [".alert-row", row],
    [".alert-minutes-input", alertMinutesInput],
    [".alert-seconds-input", alertSecondsInput],
    [".alert-duration-input", alertDurationInput],
    [".alert-color-input", alertColorInput],
  ]));
}

function createExistingSectionCard(sectionId, isOpen) {
  const card = new FakeNode();
  const alertsDisclosure = new FakeNode();

  card.dataset.sectionId = sectionId;
  alertsDisclosure.open = isOpen;
  card.queryMap.set(".alerts-disclosure", alertsDisclosure);

  return card;
}

function createRenderConfigHarness(appState) {
  const sectionList = new FakeNode();
  const themeSwitchGroup = new FakeNode();
  const storageStatus = new FakeNode();
  const manualTotalFields = new FakeNode();
  const iosFullscreenNote = new FakeNode();
  const sectionsPanelTitle = new FakeNode();
  const themeButtons = [new FakeNode(), new FakeNode(), new FakeNode()];

  themeButtons[0].dataset.themeChoice = "stage-dark";
  themeButtons[1].dataset.themeChoice = "studio-light";
  themeButtons[2].dataset.themeChoice = "amber-focus";
  themeSwitchGroup.queryAllMap.set("[data-theme-choice]", themeButtons);

  return {
    app: {
      state: appState,
      loadStatus: "loaded",
      saveStatus: "saved",
      fullscreenState: {
        installHint: null,
      },
    },
    elements: {
      presentationTitle: new FakeNode(),
      autoFullscreenEnabled: new FakeNode(),
      autoStartEnabled: new FakeNode(),
      keepScreenAwakeEnabled: new FakeNode(),
      showPresentationTimer: new FakeNode(),
      showCurrentSection: new FakeNode(),
      showNextSection: new FakeNode(),
      manualTotalEnabled: new FakeNode(),
      totalHours: new FakeNode(),
      totalMinutes: new FakeNode(),
      totalSeconds: new FakeNode(),
      sectionList,
      sectionTemplate: {
        content: {
          cloneNode() {
            return createSectionTemplateFragment();
          },
        },
      },
      alertTemplate: {
        content: {
          cloneNode() {
            return createAlertTemplateFragment();
          },
        },
      },
      manualTotalFields,
      sectionsTotalValue: new FakeNode(),
      configuredTotalValue: new FakeNode(),
      openPresentationButton: new FakeNode(),
      storageStatus,
      iosFullscreenNote,
      manualTotalNote: new FakeNode(),
      sectionsPanelTitle,
      themeSwitchGroup,
    },
  };
}

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

test("renderConfig preserva aberto o disclosure de alertas apos rerender estrutural", () => {
  const previousDocument = globalThis.document;
  const appState = createDefaultAppState();
  const { app, elements } = createRenderConfigHarness(appState);

  elements.sectionList.replaceChildren(
    createExistingSectionCard(appState.settings.sections[0].id, true),
    createExistingSectionCard(appState.settings.sections[1].id, false),
  );

  globalThis.document = {
    title: "",
    createElement() {
      return new FakeNode();
    },
  };

  try {
    renderConfig({ app, elements });

    const [firstCard, secondCard] = elements.sectionList.querySelectorAll(".section-card");

    assert.equal(firstCard.querySelector(".alerts-disclosure").open, true);
    assert.equal(secondCard.querySelector(".alerts-disclosure").open, false);
  } finally {
    globalThis.document = previousDocument;
  }
});
