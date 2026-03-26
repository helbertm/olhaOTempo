import {
  MAX_ALERTS_PER_SECTION,
  THEME_OPTIONS,
} from "./constants.js";
import {
  canStartPresentation,
  getConfiguredTotalSeconds,
  getSectionIssues,
  getSectionsTotalSeconds,
} from "./model.js";
import {
  formatClockSeconds,
  formatHumanDuration,
  splitHoursMinutesSeconds,
  splitMinutesSeconds,
} from "./time.js";

const APP_TITLE = "De olho no tempo";

export function populateStaticOptions(elements) {
  elements.themeSwitchGroup.innerHTML = THEME_OPTIONS.map(
    (theme) => `
      <button
        type="button"
        class="theme-switch-option"
        data-theme-choice="${theme.id}"
        role="radio"
        aria-checked="false"
        aria-label="${theme.label}"
        tabindex="-1"
      >
        <span class="theme-switch-visual" aria-hidden="true">
          <span class="theme-switch-screen">
            <span class="theme-switch-screen-title">TITULO</span>
            <span class="theme-switch-screen-main">15:10</span>
            <span class="theme-switch-screen-total">32:25</span>
          </span>
        </span>
      </button>
    `,
  ).join("");
}

export function renderConfig({ app, elements }) {
  const { settings } = app.state;
  const manualTotalParts = splitHoursMinutesSeconds(settings.totalManualSeconds);
  const openAlertSectionIds = new Set(
    Array.from(elements.sectionList.querySelectorAll(".section-card"))
      .filter((card) => card.querySelector(".alerts-disclosure")?.open)
      .map((card) => card.dataset.sectionId)
      .filter(Boolean),
  );

  elements.presentationTitle.value = settings.presentationTitle;
  elements.autoFullscreenEnabled.checked = settings.autoFullscreen;
  elements.autoStartEnabled.checked = settings.autoStartOnOpen;
  elements.keepScreenAwakeEnabled.checked = settings.keepScreenAwake;
  elements.showPresentationTimer.checked = settings.showPresentationTimer;
  elements.showCurrentSection.checked = settings.showCurrentSection;
  elements.showNextSection.checked = settings.showNextSection;
  elements.manualTotalEnabled.checked = settings.totalDurationMode === "manual";
  elements.totalHours.value = manualTotalParts.hours;
  elements.totalMinutes.value = manualTotalParts.minutes;
  elements.totalSeconds.value = manualTotalParts.seconds;
  elements.totalHours.disabled = settings.totalDurationMode !== "manual";
  elements.totalMinutes.disabled = settings.totalDurationMode !== "manual";
  elements.totalSeconds.disabled = settings.totalDurationMode !== "manual";

  const sectionNodes = settings.sections.map((section, index) =>
    createSectionCard({ app, elements, openAlertSectionIds }, section, index),
  );

  elements.sectionList.replaceChildren(...sectionNodes);
  refreshConfigSummary({ app, elements });
  updateDocumentTitle({ app, elements });
  updateThemeSwitchGroup(elements, settings.themeId);
}

export function getSelectedThemeId(elements) {
  const activeThemeId = elements.themeSwitchGroup.dataset.activeTheme;

  if (activeThemeId) {
    return activeThemeId;
  }

  return THEME_OPTIONS[0].id;
}

function getManualTotalNote(settings, sectionsTotalSeconds) {
  if (settings.totalDurationMode !== "manual") {
    return "O timer total da apresentação segue a soma automática das etapas.";
  }

  if (settings.totalManualSeconds === sectionsTotalSeconds) {
    return "A meta manual está alinhada com a soma das etapas.";
  }

  return "A meta manual serve como referência, mas o timer total da apresentação segue o roteiro.";
}

function createSectionCard({ app, elements, openAlertSectionIds }, section, index) {
  const fragment = elements.sectionTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".section-card");
  const titleInput = fragment.querySelector(".section-title-input");
  const sectionMinutesInput = fragment.querySelector(".section-minutes-input");
  const sectionSecondsInput = fragment.querySelector(".section-seconds-input");
  const sectionOrder = fragment.querySelector(".section-order");
  const sectionDurationPreview = fragment.querySelector(".section-duration-preview");
  const addAlertButton = fragment.querySelector(".add-alert-button");
  const moveUpButton = fragment.querySelector(".move-up-button");
  const moveDownButton = fragment.querySelector(".move-down-button");
  const alertsDisclosure = fragment.querySelector(".alerts-disclosure");
  const alertsSummaryMeta = fragment.querySelector(".alerts-summary-meta");
  const alertList = fragment.querySelector(".alert-list");
  const sectionWarning = fragment.querySelector(".section-warning");
  const durationParts = splitMinutesSeconds(section.durationSeconds);
  const issues = getSectionIssues(section);

  card.dataset.sectionId = section.id;
  sectionOrder.textContent = `Etapa ${index + 1}`;
  sectionDurationPreview.textContent = `Duração: ${formatHumanDuration(section.durationSeconds)}`;
  titleInput.value = section.title;
  sectionMinutesInput.value = durationParts.minutes;
  sectionSecondsInput.value = durationParts.seconds;
  moveUpButton.disabled = index === 0;
  moveDownButton.disabled = index === app.state.settings.sections.length - 1;
  fragment.querySelector(".remove-section-button").disabled =
    app.state.settings.sections.length === 1;
  addAlertButton.disabled = section.alerts.length >= MAX_ALERTS_PER_SECTION;
  alertsDisclosure.open = openAlertSectionIds.has(section.id);
  alertsSummaryMeta.textContent = getAlertSummaryText(section.alerts.length);

  if (issues.length > 0) {
    sectionWarning.textContent = issues[0];
    sectionWarning.classList.remove("hidden");
  }

  if (section.alerts.length === 0) {
    const emptyAlertText = document.createElement("p");
    emptyAlertText.className = "helper-text";
    emptyAlertText.textContent = "Sem alertas visuais nesta etapa.";
    alertList.append(emptyAlertText);
  } else {
    const alertNodes = section.alerts.map((alert) => createAlertRow(elements, alert));
    alertList.replaceChildren(...alertNodes);
  }

  return fragment;
}

function createAlertRow(elements, alert) {
  const fragment = elements.alertTemplate.content.cloneNode(true);
  const row = fragment.querySelector(".alert-row");
  const alertMinutesInput = fragment.querySelector(".alert-minutes-input");
  const alertSecondsInput = fragment.querySelector(".alert-seconds-input");
  const alertDurationInput = fragment.querySelector(".alert-duration-input");
  const alertColorInput = fragment.querySelector(".alert-color-input");
  const alertParts = splitMinutesSeconds(alert.elapsedSeconds);

  row.dataset.alertId = alert.id;
  alertMinutesInput.value = alertParts.minutes;
  alertSecondsInput.value = alertParts.seconds;
  alertDurationInput.value = alert.highlightSeconds;
  alertColorInput.value = alert.color;

  return fragment;
}

function getAlertSummaryText(alertCount) {
  if (alertCount === 0) {
    return "Sem alertas configurados";
  }

  if (alertCount === 1) {
    return "1 alerta configurado";
  }

  return `${alertCount} alertas configurados`;
}

export function refreshConfigSummary({ app, elements }) {
  const { settings } = app.state;
  const sectionsTotalSeconds = getSectionsTotalSeconds(settings);
  const configuredTotalSeconds = getConfiguredTotalSeconds(settings);
  const canStart = canStartPresentation(settings);
  const manualIsEnabled = settings.totalDurationMode === "manual";
  const storageMeta = getStorageStatusMeta({
    loadStatus: app.loadStatus,
    saveStatus: app.saveStatus,
  });

  elements.manualTotalFields.classList.toggle("is-disabled", !manualIsEnabled);
  elements.sectionsTotalValue.textContent = formatClockSeconds(sectionsTotalSeconds);
  elements.configuredTotalValue.textContent = formatClockSeconds(configuredTotalSeconds);
  elements.openPresentationButton.disabled = !canStart;
  elements.storageStatus.textContent = storageMeta.label;
  elements.storageStatus.classList.toggle("inline-status-saved", storageMeta.state === "saved");
  elements.storageStatus.classList.toggle(
    "inline-status-unsaved",
    storageMeta.state === "unsaved",
  );
  elements.iosFullscreenNote.classList.toggle(
    "hidden",
    app.fullscreenState.installHint !== "ios-home-screen",
  );
  elements.manualTotalNote.textContent = getManualTotalNote(settings, sectionsTotalSeconds);
}

export function updateDocumentTitle({ app, elements }) {
  const configuredTitle = app.state.settings.presentationTitle.trim();

  if (
    configuredTitle.length === 0 ||
    configuredTitle.toLocaleLowerCase("pt-BR") === APP_TITLE.toLocaleLowerCase("pt-BR")
  ) {
    document.title = APP_TITLE;
  } else {
    document.title = `${configuredTitle} · ${APP_TITLE}`;
  }

  elements.sectionsPanelTitle.textContent = getSectionsPanelTitle(app.state.settings);
}

export function getSectionsPanelTitle(settings) {
  const title = settings.presentationTitle.trim();
  return title ? `${title} - Etapas` : "Etapas";
}

export function getStorageStatusMeta({ loadStatus, saveStatus }) {
  const saveFailed = saveStatus === "error" || saveStatus === "unavailable";
  const hasSavedLocally = saveStatus === "saved" || (loadStatus === "loaded" && !saveFailed);

  if (hasSavedLocally) {
    return {
      label: "Configurações salvas",
      state: "saved",
    };
  }

  return {
    label: "Configurações não salvas",
    state: "unsaved",
  };
}

export function updateThemeSwitchGroup(elements, activeThemeId) {
  const themeButtons = elements.themeSwitchGroup.querySelectorAll("[data-theme-choice]");
  elements.themeSwitchGroup.dataset.activeTheme = activeThemeId;

  for (const themeButton of themeButtons) {
    const isActive = themeButton.dataset.themeChoice === activeThemeId;
    themeButton.setAttribute("aria-checked", String(isActive));
    themeButton.setAttribute("tabindex", isActive ? "0" : "-1");
    themeButton.classList.toggle("theme-switch-option-active", isActive);
  }
}
