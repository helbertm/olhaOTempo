import assert from "node:assert/strict";
import test from "node:test";

import { STORAGE_KEY } from "../js/constants.js";
import { createDefaultAppState } from "../js/defaults.js";
import {
  areSettingsEqual,
  normalizeSettings,
} from "../js/model.js";
import { loadPersistedState, savePersistedState } from "../js/storage.js";

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("salva e carrega o estado normalizado do app", () => {
  const storage = createMemoryStorage();
  const state = createDefaultAppState();

  state.settings.presentationTitle = "Evento local";
  state.settings.autoFullscreen = false;
  state.settings.keepScreenAwake = false;
  state.settings.autoStartOnOpen = true;
  state.settings.showPresentationTimer = false;
  state.settings.showCurrentSection = false;
  state.settings.showNextSection = true;

  const saveResult = savePersistedState(state, storage);
  const loadResult = loadPersistedState(storage);

  assert.equal(saveResult.ok, true);
  assert.equal(loadResult.status, "loaded");
  assert.equal(loadResult.state.settings.presentationTitle, "Evento local");
  assert.equal(loadResult.state.settings.autoFullscreen, false);
  assert.equal(loadResult.state.settings.keepScreenAwake, false);
  assert.equal(loadResult.state.settings.autoStartOnOpen, true);
  assert.equal(loadResult.state.settings.showPresentationTimer, false);
  assert.equal(loadResult.state.settings.showCurrentSection, false);
  assert.equal(loadResult.state.settings.showNextSection, true);
});

test("recupera um estado seguro quando o localStorage está inválido", () => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, "{quebrado");

  const loadResult = loadPersistedState(storage);

  assert.equal(loadResult.status, "recovered");
  assert.ok(loadResult.state.settings.sections.length > 0);
});

test("segue inicializando quando o storage nao esta disponivel", () => {
  const state = createDefaultAppState();
  const loadResult = loadPersistedState(null);
  const saveResult = savePersistedState(state, null);

  assert.equal(loadResult.status, "unavailable");
  assert.equal(saveResult.status, "unavailable");
  assert.ok(loadResult.state.settings.sections.length > 0);
});

test("normalizacao garante pelo menos uma etapa", () => {
  const settings = normalizeSettings({
    presentationTitle: "Sem etapas",
    sections: [],
  });

  assert.equal(settings.sections.length, 1);
});

test("normalizacao ativa exibicao de etapa e proxima etapa por padrao", () => {
  const settings = normalizeSettings({
    presentationTitle: "Padrao",
    sections: [{ id: "section-1", title: "A", durationSeconds: 60, alerts: [] }],
  });

  assert.equal(settings.autoFullscreen, true);
  assert.equal(settings.keepScreenAwake, true);
  assert.equal(settings.autoStartOnOpen, false);
  assert.equal(settings.showCurrentSection, true);
  assert.equal(settings.showNextSection, true);
});

test("normalizacao aplica duracao padrao e limites dos alertas", () => {
  const settings = normalizeSettings({
    presentationTitle: "Alertas",
    sections: [
      {
        id: "section-1",
        title: "A",
        durationSeconds: 60,
        alerts: [
          { id: "alert-1", elapsedSeconds: 10, highlightSeconds: 1, color: "#ef4444" },
          { id: "alert-2", elapsedSeconds: 20, highlightSeconds: 40, color: "#f59e0b" },
          { id: "alert-3", elapsedSeconds: 30, color: "#38bdf8" },
        ],
      },
    ],
  });

  assert.equal(settings.sections[0].alerts[0].highlightSeconds, 5);
  assert.equal(settings.sections[0].alerts[1].highlightSeconds, 30);
  assert.equal(settings.sections[0].alerts[2].highlightSeconds, 10);
});

test("round-trip preserva todas as configuracoes e a estrutura do roteiro", () => {
  const storage = createMemoryStorage();
  const state = createDefaultAppState();

  state.settings = normalizeSettings({
    presentationTitle: "Summit 2026",
    themeId: "amber-focus",
    autoFullscreen: false,
    keepScreenAwake: false,
    autoStartOnOpen: true,
    showPresentationTimer: false,
    showCurrentSection: true,
    showNextSection: false,
    totalDurationMode: "manual",
    totalManualSeconds: 4_815,
    sections: [
      {
        id: "section-1",
        title: "AB",
        durationSeconds: 305,
        alerts: [
          {
            id: "alert-1",
            elapsedSeconds: 120,
            highlightSeconds: 7,
            color: "#ef4444",
          },
        ],
      },
      {
        id: "section-2",
        title: "CD",
        durationSeconds: 95,
        alerts: [
          {
            id: "alert-2",
            elapsedSeconds: 30,
            highlightSeconds: 12,
            color: "#38bdf8",
          },
          {
            id: "alert-3",
            elapsedSeconds: 60,
            highlightSeconds: 30,
            color: "#f59e0b",
          },
        ],
      },
    ],
  });

  const expectedSettings = normalizeSettings(state.settings);
  const saveResult = savePersistedState(state, storage);
  const loadResult = loadPersistedState(storage);

  assert.equal(saveResult.ok, true);
  assert.equal(loadResult.status, "loaded");
  assert.deepEqual(loadResult.state.settings, expectedSettings);
});

test("comparacao estrutural de configuracoes identifica igualdade real", () => {
  const base = normalizeSettings({
    presentationTitle: "Summit 2026",
    themeId: "amber-focus",
    autoFullscreen: false,
    keepScreenAwake: true,
    autoStartOnOpen: true,
    showPresentationTimer: false,
    showCurrentSection: true,
    showNextSection: false,
    totalDurationMode: "manual",
    totalManualSeconds: 4_800,
    sections: [
      {
        id: "section-1",
        title: "AB",
        durationSeconds: 305,
        alerts: [
          {
            id: "alert-1",
            elapsedSeconds: 120,
            highlightSeconds: 7,
            color: "#ef4444",
          },
        ],
      },
    ],
  });
  const same = normalizeSettings(structuredClone(base));
  const changed = normalizeSettings({
    ...structuredClone(base),
    showNextSection: true,
  });

  assert.equal(areSettingsEqual(base, same), true);
  assert.equal(areSettingsEqual(base, changed), false);
});
