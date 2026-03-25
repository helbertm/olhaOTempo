import {
  DEFAULT_ALERT_HIGHLIGHT_SECONDS,
  DEFAULT_THEME_ID,
  STORAGE_VERSION,
} from "./constants.js";
import { createId } from "./utils.js";

export function createDefaultAlert(index = 0) {
  const presets = [
    { elapsedSeconds: 180, color: "#f59e0b" },
    { elapsedSeconds: 240, color: "#f97316" },
    { elapsedSeconds: 300, color: "#ef4444" },
  ];

  const fallback = presets[index] ?? presets[presets.length - 1];

  return {
    id: createId("alert"),
    elapsedSeconds: fallback.elapsedSeconds,
    highlightSeconds: DEFAULT_ALERT_HIGHLIGHT_SECONDS,
    color: fallback.color,
  };
}

export function createDefaultSection(index = 0) {
  const presets = [
    {
      title: "Abertura",
      durationSeconds: 300,
      alerts: [
        { elapsedSeconds: 180, color: "#f59e0b" },
        { elapsedSeconds: 240, color: "#ef4444" },
      ],
    },
    {
      title: "Demonstração principal",
      durationSeconds: 540,
      alerts: [
        { elapsedSeconds: 240, color: "#38bdf8" },
        { elapsedSeconds: 360, color: "#f59e0b" },
        { elapsedSeconds: 480, color: "#ef4444" },
      ],
    },
    {
      title: "Encerramento",
      durationSeconds: 180,
      alerts: [
        { elapsedSeconds: 120, color: "#f59e0b" },
        { elapsedSeconds: 150, color: "#ef4444" },
      ],
    },
  ];

  const preset = presets[index] ?? {
    title: `Nova etapa ${index + 1}`,
    durationSeconds: 180,
    alerts: [],
  };

  return {
    id: createId("section"),
    title: preset.title,
    durationSeconds: preset.durationSeconds,
    alerts: preset.alerts.map((alert, alertIndex) => ({
      id: createId("alert"),
      elapsedSeconds: alert.elapsedSeconds,
      highlightSeconds: alert.highlightSeconds ?? DEFAULT_ALERT_HIGHLIGHT_SECONDS,
      color: alert.color,
      order: alertIndex,
    })),
  };
}

export function createIdleSession() {
  return {
    status: "idle",
    startedAtMs: null,
    pausedAtMs: null,
    pausedAccumulatedMs: 0,
  };
}

export function createDefaultSettings() {
  const sections = [
    createDefaultSection(0),
    createDefaultSection(1),
    createDefaultSection(2),
  ];

  const sectionsTotalSeconds = sections.reduce(
    (total, section) => total + section.durationSeconds,
    0,
  );

  return {
    presentationTitle: "Roteiro principal",
    themeId: DEFAULT_THEME_ID,
    autoFullscreen: true,
    keepScreenAwake: true,
    autoStartOnOpen: false,
    showPresentationTimer: true,
    showCurrentSection: true,
    showNextSection: true,
    totalDurationMode: "sections",
    totalManualSeconds: sectionsTotalSeconds,
    sections,
  };
}

export function createDefaultRuntime() {
  return {
    view: "edit",
    session: createIdleSession(),
  };
}

export function createDefaultAppState() {
  return {
    version: STORAGE_VERSION,
    settings: createDefaultSettings(),
    runtime: createDefaultRuntime(),
  };
}
