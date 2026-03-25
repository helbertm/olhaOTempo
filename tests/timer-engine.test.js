import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSettings } from "../js/model.js";
import {
  derivePresentationSnapshot,
  pauseSession,
  resumeSession,
  startSession,
} from "../js/timer-engine.js";

function createTestSettings(overrides = {}) {
  return normalizeSettings({
    presentationTitle: "Teste",
    themeId: "stage-dark",
    totalDurationMode: "manual",
    totalManualSeconds: 120,
    sections: [
      {
        id: "section-1",
        title: "Abertura",
        durationSeconds: 60,
        alerts: [{ id: "alert-1", elapsedSeconds: 30, color: "#ef4444" }],
      },
      {
        id: "section-2",
        title: "Fechamento",
        durationSeconds: 60,
        alerts: [],
      },
    ],
    ...overrides,
  });
}

test("ativa alertas e avança automaticamente de etapa", () => {
  const settings = createTestSettings();
  const session = startSession(1_000);
  const alertSnapshot = derivePresentationSnapshot(settings, session, 31_000);
  const nextSectionSnapshot = derivePresentationSnapshot(settings, session, 61_000);

  assert.equal(alertSnapshot.currentSectionIndex, 0);
  assert.equal(alertSnapshot.currentSectionElapsedMs, 30_000);
  assert.equal(alertSnapshot.currentSectionRemainingMs, 30_000);
  assert.equal(alertSnapshot.activeAlerts.length, 1);

  assert.equal(nextSectionSnapshot.currentSectionIndex, 1);
  assert.equal(nextSectionSnapshot.currentSectionElapsedMs, 0);
  assert.equal(nextSectionSnapshot.currentSection.title, "Fechamento");
});

test("mantem o alerta ativo pelo tempo configurado", () => {
  const settings = createTestSettings({
    sections: [
      {
        id: "section-1",
        title: "Abertura",
        durationSeconds: 60,
        alerts: [{ id: "alert-1", elapsedSeconds: 30, highlightSeconds: 5, color: "#ef4444" }],
      },
      {
        id: "section-2",
        title: "Fechamento",
        durationSeconds: 60,
        alerts: [],
      },
    ],
  });
  const session = startSession(0);
  const activeSnapshot = derivePresentationSnapshot(settings, session, 34_000);
  const expiredSnapshot = derivePresentationSnapshot(settings, session, 36_000);

  assert.equal(activeSnapshot.activeAlerts.length, 1);
  assert.equal(expiredSnapshot.activeAlerts.length, 0);
});

test("overtime final depende do roteiro, nao da meta manual", () => {
  const settings = createTestSettings({ totalManualSeconds: 90 });
  const session = startSession(0);
  const lateButInRouteSnapshot = derivePresentationSnapshot(settings, session, 100_000);
  const overtimeSnapshot = derivePresentationSnapshot(settings, session, 125_000);

  assert.equal(lateButInRouteSnapshot.isFinalOvertime, false);
  assert.equal(lateButInRouteSnapshot.routeRemainingMs, 20_000);
  assert.equal(overtimeSnapshot.isFinalOvertime, true);
  assert.equal(overtimeSnapshot.finalOvertimeMs, 5_000);
  assert.equal(overtimeSnapshot.routeRemainingMs, -5_000);
});

test("pausa e retoma sem perder a precisão do tempo acumulado", () => {
  const settings = createTestSettings();
  const startedSession = startSession(1_000);
  const pausedSession = pauseSession(startedSession, 11_000);
  const resumedSession = resumeSession(pausedSession, 21_000);
  const snapshot = derivePresentationSnapshot(settings, resumedSession, 26_000);

  assert.equal(snapshot.totalElapsedMs, 15_000);
  assert.equal(snapshot.currentSectionIndex, 0);
  assert.equal(snapshot.currentSectionRemainingMs, 45_000);
});

test("na última etapa o restante da etapa coincide com o restante do roteiro", () => {
  const settings = createTestSettings();
  const session = startSession(0);
  const snapshot = derivePresentationSnapshot(settings, session, 70_000);

  assert.equal(snapshot.currentSectionIndex, 1);
  assert.equal(snapshot.nextSection, null);
  assert.equal(snapshot.currentSectionRemainingMs, snapshot.routeRemainingMs);
});
