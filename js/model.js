import {
  DEFAULT_THEME_ID,
  MAX_ALERT_HIGHLIGHT_SECONDS,
  MAX_ALERTS_PER_SECTION,
  MIN_ALERT_HIGHLIGHT_SECONDS,
  STORAGE_VERSION,
  THEME_OPTIONS,
} from "./constants.js";
import {
  createDefaultAlert,
  createDefaultAppState,
  createDefaultSection,
  createDefaultSettings,
  createDefaultRuntime,
  createIdleSession,
} from "./defaults.js";
import { clampNumber } from "./utils.js";

function toStringValue(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNonNegativeInteger(value, fallback = 0) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.max(0, Math.floor(numericValue));
}

function toTimestamp(value, fallback = null) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeColor(value, fallback = "#f97316") {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback;
}

function isAllowedOption(value, options) {
  return options.some((option) => option.id === value);
}

export function normalizeAlert(rawAlert = {}, sectionDurationSeconds = 0, index = 0) {
  const fallback = createDefaultAlert(index);
  const safeSectionDuration = Math.max(0, sectionDurationSeconds);
  const elapsedSeconds = clampNumber(
    toNonNegativeInteger(rawAlert.elapsedSeconds, fallback.elapsedSeconds),
    0,
    safeSectionDuration,
  );
  const highlightSeconds = clampNumber(
    toNonNegativeInteger(rawAlert.highlightSeconds, fallback.highlightSeconds),
    MIN_ALERT_HIGHLIGHT_SECONDS,
    MAX_ALERT_HIGHLIGHT_SECONDS,
  );

  return {
    id: toStringValue(rawAlert.id, fallback.id) || fallback.id,
    elapsedSeconds,
    highlightSeconds,
    color: normalizeColor(rawAlert.color, fallback.color),
  };
}

export function normalizeSection(rawSection = {}, index = 0) {
  const fallback = createDefaultSection(index);
  const durationSeconds = toNonNegativeInteger(
    rawSection.durationSeconds,
    fallback.durationSeconds,
  );
  const rawAlerts = Array.isArray(rawSection.alerts)
    ? rawSection.alerts.slice(0, MAX_ALERTS_PER_SECTION)
    : fallback.alerts;

  return {
    id: toStringValue(rawSection.id, fallback.id) || fallback.id,
    title: toStringValue(rawSection.title, fallback.title).trim(),
    durationSeconds,
    alerts: rawAlerts
      .map((alert, alertIndex) =>
        normalizeAlert(alert, durationSeconds, alertIndex),
      )
      .sort((leftAlert, rightAlert) => leftAlert.elapsedSeconds - rightAlert.elapsedSeconds),
  };
}

export function normalizeSettings(rawSettings = {}) {
  const fallback = createDefaultSettings();
  const sectionsSource = Array.isArray(rawSettings.sections)
    ? rawSettings.sections
    : fallback.sections;
  const normalizedSections = sectionsSource.map((section, sectionIndex) =>
    normalizeSection(section, sectionIndex),
  );
  const sections =
    normalizedSections.length > 0 ? normalizedSections : [createDefaultSection(0)];

  return {
    presentationTitle: toStringValue(
      rawSettings.presentationTitle,
      fallback.presentationTitle,
    ).trim(),
    themeId: isAllowedOption(rawSettings.themeId, THEME_OPTIONS)
      ? rawSettings.themeId
      : DEFAULT_THEME_ID,
    autoFullscreen: rawSettings.autoFullscreen !== false,
    keepScreenAwake: rawSettings.keepScreenAwake !== false,
    autoStartOnOpen: rawSettings.autoStartOnOpen === true,
    showPresentationTimer: rawSettings.showPresentationTimer !== false,
    showCurrentSection: rawSettings.showCurrentSection !== false,
    showNextSection: rawSettings.showNextSection !== false,
    totalDurationMode:
      rawSettings.totalDurationMode === "manual" ? "manual" : "sections",
    totalManualSeconds: toNonNegativeInteger(
      rawSettings.totalManualSeconds,
      fallback.totalManualSeconds,
    ),
    sections,
  };
}

export function normalizeSession(rawSession = {}) {
  const status =
    rawSession.status === "running" || rawSession.status === "paused"
      ? rawSession.status
      : "idle";

  if (status === "idle") {
    return createIdleSession();
  }

  const startedAtMs = toTimestamp(rawSession.startedAtMs);

  if (startedAtMs === null) {
    return createIdleSession();
  }

  const pausedAccumulatedMs = toNonNegativeInteger(
    rawSession.pausedAccumulatedMs,
    0,
  );

  if (status === "paused") {
    const pausedAtMs = toTimestamp(rawSession.pausedAtMs, startedAtMs);
    const safePausedAtMs = Math.max(pausedAtMs, startedAtMs);

    return {
      status: "paused",
      startedAtMs,
      pausedAtMs: safePausedAtMs,
      pausedAccumulatedMs: Math.min(
        pausedAccumulatedMs,
        safePausedAtMs - startedAtMs,
      ),
    };
  }

  return {
    status: "running",
    startedAtMs,
    pausedAtMs: null,
    pausedAccumulatedMs,
  };
}

export function normalizeRuntime(rawRuntime = {}) {
  return {
    view: rawRuntime.view === "presentation" ? "presentation" : "edit",
    session: normalizeSession(rawRuntime.session),
  };
}

export function normalizeAppState(rawState = {}) {
  const fallback = createDefaultAppState();

  return {
    version: STORAGE_VERSION,
    settings: normalizeSettings(rawState.settings ?? fallback.settings),
    runtime: normalizeRuntime(rawState.runtime ?? createDefaultRuntime()),
  };
}

export function getSectionsTotalSeconds(settings) {
  return settings.sections.reduce(
    (total, section) => total + section.durationSeconds,
    0,
  );
}

export function getConfiguredTotalSeconds(settings) {
  return settings.totalDurationMode === "manual"
    ? settings.totalManualSeconds
    : getSectionsTotalSeconds(settings);
}

export function getThemeMeta(themeId) {
  return THEME_OPTIONS.find((theme) => theme.id === themeId) ?? THEME_OPTIONS[0];
}

export function getSectionIssues(section) {
  const issues = [];

  if (section.durationSeconds <= 0) {
    issues.push("Defina uma duração maior que zero para usar esta etapa.");
  }

  if (section.alerts.length > MAX_ALERTS_PER_SECTION) {
    issues.push("Cada etapa aceita no máximo 3 alertas.");
  }

  return issues;
}

export function getSettingsIssues(settings) {
  const issues = [];

  if (settings.sections.length === 0) {
    issues.push("Adicione pelo menos uma etapa antes de iniciar.");
  }

  for (const section of settings.sections) {
    issues.push(...getSectionIssues(section));
  }

  return issues;
}

export function canStartPresentation(settings) {
  return getSettingsIssues(settings).length === 0;
}
