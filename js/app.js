import {
  MAX_ALERTS_PER_SECTION,
  THEME_OPTIONS,
} from "./constants.js";
import {
  FullscreenController,
  WakeLockController,
} from "./capabilities.js";
import {
  createDefaultAlert,
  createDefaultAppState,
  createDefaultSection,
} from "./defaults.js";
import {
  canStartPresentation,
  getConfiguredTotalSeconds,
  getSectionIssues,
  getSectionsTotalSeconds,
  getThemeMeta,
  normalizeSettings,
} from "./model.js";
import { clearPersistedState, loadPersistedState, savePersistedState } from "./storage.js";
import {
  derivePresentationSnapshot,
  hasActiveSession,
  pauseSession,
  resetSession,
  resumeSession,
  startSession,
} from "./timer-engine.js";
import {
  formatClockMilliseconds,
  formatClockSeconds,
  formatHumanDuration,
  parseHoursMinutesSeconds,
  parseMinutesSeconds,
  splitHoursMinutesSeconds,
  splitMinutesSeconds,
} from "./time.js";

const elements = {
  configView: document.querySelector("#config-view"),
  presentationView: document.querySelector("#presentation-view"),
  configWakeLockButton: document.querySelector("#config-wake-lock-button"),
  presentationTitle: document.querySelector("#presentation-title"),
  themeSelect: document.querySelector("#theme-select"),
  themeSwitchGroup: document.querySelector("#theme-switch-group"),
  autoFullscreenEnabled: document.querySelector("#auto-fullscreen-enabled"),
  autoStartEnabled: document.querySelector("#auto-start-enabled"),
  showPresentationTimer: document.querySelector("#show-presentation-timer"),
  showCurrentSection: document.querySelector("#show-current-section"),
  showNextSection: document.querySelector("#show-next-section"),
  iosFullscreenNote: document.querySelector("#ios-fullscreen-note"),
  manualTotalEnabled: document.querySelector("#manual-total-enabled"),
  manualTotalFields: document.querySelector("#manual-total-fields"),
  totalHours: document.querySelector("#total-hours"),
  totalMinutes: document.querySelector("#total-minutes"),
  totalSeconds: document.querySelector("#total-seconds"),
  manualTotalNote: document.querySelector("#manual-total-note"),
  sectionsTotalValue: document.querySelector("#sections-total-value"),
  configuredTotalValue: document.querySelector("#configured-total-value"),
  storageStatus: document.querySelector("#storage-status"),
  sectionsPanelTitle: document.querySelector("#sections-panel-title"),
  sectionList: document.querySelector("#section-list"),
  addSectionButton: document.querySelector("#add-section-button"),
  openPresentationButton: document.querySelector("#open-presentation-button"),
  resetConfigButton: document.querySelector("#reset-config-button"),
  sectionTemplate: document.querySelector("#section-template"),
  alertTemplate: document.querySelector("#alert-template"),
  presentationTitleDisplay: document.querySelector("#presentation-title-display"),
  themeChip: document.querySelector("#theme-chip"),
  fullscreenChip: document.querySelector("#fullscreen-chip"),
  wakeLockChip: document.querySelector("#wake-lock-chip"),
  visibilityChip: document.querySelector("#visibility-chip"),
  startButton: document.querySelector("#start-button"),
  pauseButton: document.querySelector("#pause-button"),
  resumeButton: document.querySelector("#resume-button"),
  resetButton: document.querySelector("#reset-button"),
  fullscreenButton: document.querySelector("#fullscreen-button"),
  editModeButton: document.querySelector("#edit-mode-button"),
  presentationMain: document.querySelector("#presentation-main"),
  timerStack: document.querySelector("#timer-stack"),
  totalTimerPanel: document.querySelector("#total-timer-panel"),
  overtimeScreen: document.querySelector("#overtime-screen"),
  overtimeValue: document.querySelector("#overtime-value"),
  modeSummary: document.querySelector("#mode-summary"),
  currentSectionTitle: document.querySelector("#current-section-title"),
  sectionTimerLabel: document.querySelector("#section-timer-label"),
  sectionTimerValue: document.querySelector("#section-timer-value"),
  totalTimerLabel: document.querySelector("#total-timer-label"),
  totalTimerValue: document.querySelector("#total-timer-value"),
  toastRegion: document.querySelector("#toast-region"),
};

const loadResult = loadPersistedState();

const app = {
  state: loadResult.state,
  loadStatus: loadResult.status,
  saveStatus: "idle",
  frameId: 0,
  lastRenderedSectionId: null,
  lastOvertimeState: false,
  wasHidden: document.visibilityState === "hidden",
  fullscreenState: {
    supported: false,
    active: false,
    requestSupported: false,
    standalone: false,
    installHint: null,
  },
  wakeLockState: {
    supported: false,
    active: false,
    shouldPersist: false,
    code: "inactive",
  },
};

const fullscreenController = new FullscreenController({
  onChange: handleFullscreenChange,
});
const wakeLockController = new WakeLockController({
  onChange: handleWakeLockChange,
});

app.fullscreenState = fullscreenController.getState();
app.wakeLockState = wakeLockController.getState();

initialize();

function initialize() {
  populateStaticOptions();

  if (app.state.runtime.view === "presentation" && !canStartPresentation(app.state.settings)) {
    app.state.runtime.view = "edit";
    app.state.runtime.session = resetSession();
  }

  renderConfig();
  setView(app.state.runtime.view, { persist: false });
  attachEventListeners();
  renderPresentation();

  if (app.loadStatus === "recovered") {
    showToast("Um salvamento inválido foi ignorado e o app voltou para um modelo seguro.");
  }

  if (app.loadStatus === "unavailable") {
    showToast("O armazenamento local não está disponível. As mudanças podem se perder ao fechar a página.");
  }

  if (app.state.runtime.view === "presentation" && app.state.runtime.session.status === "running") {
    showToast("A apresentação foi recuperada a partir do estado salvo neste navegador.");
  }
}

function populateStaticOptions() {
  elements.themeSelect.innerHTML = THEME_OPTIONS.map(
    (theme) => `<option value="${theme.id}">${theme.label}</option>`,
  ).join("");
  elements.themeSwitchGroup.innerHTML = THEME_OPTIONS.map(
    (theme) => `
      <button
        type="button"
        class="theme-switch-option"
        data-theme-choice="${theme.id}"
        aria-pressed="false"
        aria-label="${theme.label}"
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

function attachEventListeners() {
  elements.addSectionButton.addEventListener("click", handleAddSection);
  elements.openPresentationButton.addEventListener("click", openPresentationMode);
  elements.configWakeLockButton.addEventListener("click", handleToggleWakeLock);
  elements.themeSwitchGroup.addEventListener("click", handleThemeSwitchClick);
  elements.resetConfigButton.addEventListener("click", handleResetConfig);

  elements.configView.addEventListener("input", handleConfigInput);
  elements.configView.addEventListener("change", handleConfigChange);
  elements.sectionList.addEventListener("click", handleSectionListClick);

  elements.startButton.addEventListener("click", handleStartPresentation);
  elements.pauseButton.addEventListener("click", handlePausePresentation);
  elements.resumeButton.addEventListener("click", handleResumePresentation);
  elements.resetButton.addEventListener("click", handleResetPresentation);
  elements.fullscreenButton.addEventListener("click", handleToggleFullscreen);
  elements.editModeButton.addEventListener("click", handleReturnToEditMode);

  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("keydown", handlePresentationShortcuts);
}

function renderConfig() {
  const { settings } = app.state;
  const manualTotalParts = splitHoursMinutesSeconds(settings.totalManualSeconds);

  elements.presentationTitle.value = settings.presentationTitle;
  elements.themeSelect.value = settings.themeId;
  elements.autoFullscreenEnabled.checked = settings.autoFullscreen;
  elements.autoStartEnabled.checked = settings.autoStartOnOpen;
  updateConfigWakeLockButton();
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
    createSectionCard(section, index),
  );

  elements.sectionList.replaceChildren(...sectionNodes);
  refreshConfigSummary();
  updateDocumentTitle();
  updateThemeSwitchGroup(settings.themeId);
}

function createSectionCard(section, index) {
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
    const alertNodes = section.alerts.map((alert) => createAlertRow(alert));
    alertList.replaceChildren(...alertNodes);
  }

  return fragment;
}

function createAlertRow(alert) {
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

function refreshConfigSummary() {
  const { settings } = app.state;
  const sectionsTotalSeconds = getSectionsTotalSeconds(settings);
  const configuredTotalSeconds = getConfiguredTotalSeconds(settings);
  const canStart = canStartPresentation(settings);
  const manualIsEnabled = settings.totalDurationMode === "manual";
  const storageMeta = getStorageStatusMeta();

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

  if (!manualIsEnabled) {
    elements.manualTotalNote.textContent =
      "O timer total da apresentação segue a soma automática das etapas.";
  } else if (settings.totalManualSeconds < sectionsTotalSeconds) {
    elements.manualTotalNote.textContent =
      "A meta manual serve como referência, mas o timer total da apresentação segue o roteiro.";
  } else if (settings.totalManualSeconds > sectionsTotalSeconds) {
    elements.manualTotalNote.textContent =
      "A meta manual serve como referência, mas o timer total da apresentação segue o roteiro.";
  } else {
    elements.manualTotalNote.textContent =
      "A meta manual está alinhada com a soma das etapas.";
  }
}

function updateDocumentTitle() {
  const title = app.state.settings.presentationTitle || "De olho no tempo";
  document.title = `${title} · De olho no tempo`;
  elements.sectionsPanelTitle.textContent = getSectionsPanelTitle();
}

function getSectionsPanelTitle() {
  const title = app.state.settings.presentationTitle.trim();
  return title ? `${title} - Etapas` : "Etapas";
}

function getStorageStatusMeta() {
  const saveFailed =
    app.saveStatus === "error" || app.saveStatus === "unavailable";
  const hasSavedLocally =
    app.saveStatus === "saved" ||
    (app.loadStatus === "loaded" && !saveFailed);

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

function handleConfigInput(event) {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  syncSettingsFromDom({ rerender: false });
}

function handleThemeSwitchClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const themeButton = target.closest("[data-theme-choice]");

  if (themeButton instanceof HTMLButtonElement) {
    const nextThemeId = themeButton.dataset.themeChoice;

    if (nextThemeId && nextThemeId !== elements.themeSelect.value) {
      elements.themeSelect.value = nextThemeId;
      syncSettingsFromDom({ rerender: true });
    }
  }
}

function handleConfigChange(event) {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  syncSettingsFromDom({ rerender: true });
}

function syncSettingsFromDom({ rerender }) {
  const previousSettings = JSON.stringify(app.state.settings);
  const nextSettings = normalizeSettings(serializeSettingsFromDom());
  const didChange = JSON.stringify(nextSettings) !== previousSettings;

  app.state.settings = nextSettings;

  if (didChange && hasActiveSession(app.state.runtime.session)) {
    app.state.runtime.session = resetSession();
    showToast("O cronômetro foi zerado porque o roteiro foi alterado.");
  }

  persistState();

  if (rerender) {
    renderConfig();
  } else {
    refreshConfigSummary();
    updateDocumentTitle();
  }

  renderPresentation();
}

function serializeSettingsFromDom() {
  const sectionCards = Array.from(elements.sectionList.querySelectorAll(".section-card"));

  return {
    presentationTitle: elements.presentationTitle.value.trim(),
    themeId: elements.themeSelect.value,
    autoFullscreen: elements.autoFullscreenEnabled.checked,
    keepScreenAwake: app.state.settings.keepScreenAwake,
    autoStartOnOpen: elements.autoStartEnabled.checked,
    showPresentationTimer: elements.showPresentationTimer.checked,
    showCurrentSection: elements.showCurrentSection.checked,
    showNextSection: elements.showNextSection.checked,
    totalDurationMode: elements.manualTotalEnabled.checked ? "manual" : "sections",
    totalManualSeconds: parseHoursMinutesSeconds(
      elements.totalHours.value,
      elements.totalMinutes.value,
      elements.totalSeconds.value,
    ),
    sections: sectionCards.map((card) => {
      const sectionMinutesInput = card.querySelector(".section-minutes-input");
      const sectionSecondsInput = card.querySelector(".section-seconds-input");
      const alertRows = Array.from(card.querySelectorAll(".alert-row"));

      return {
        id: card.dataset.sectionId,
        title: card.querySelector(".section-title-input").value.trim(),
        durationSeconds: parseMinutesSeconds(
          sectionMinutesInput.value,
          sectionSecondsInput.value,
        ),
        alerts: alertRows.map((row) => {
          const alertMinutesInput = row.querySelector(".alert-minutes-input");
          const alertSecondsInput = row.querySelector(".alert-seconds-input");
          const alertDurationInput = row.querySelector(".alert-duration-input");
          const alertColorInput = row.querySelector(".alert-color-input");

          return {
            id: row.dataset.alertId,
            elapsedSeconds: parseMinutesSeconds(
              alertMinutesInput.value,
              alertSecondsInput.value,
            ),
            highlightSeconds: Number.parseInt(alertDurationInput.value, 10),
            color: alertColorInput.value,
          };
        }),
      };
    }),
  };
}

function handleSectionListClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const sectionCard = target.closest(".section-card");
  const alertRow = target.closest(".alert-row");
  const sectionId = sectionCard?.dataset.sectionId;
  const alertId = alertRow?.dataset.alertId;

  if (target.matches(".move-up-button") && sectionId) {
    mutateSettingsStructure((settings) => {
      const sectionIndex = settings.sections.findIndex((section) => section.id === sectionId);
      if (sectionIndex > 0) {
        const [section] = settings.sections.splice(sectionIndex, 1);
        settings.sections.splice(sectionIndex - 1, 0, section);
      }
    });
  }

  if (target.matches(".move-down-button") && sectionId) {
    mutateSettingsStructure((settings) => {
      const sectionIndex = settings.sections.findIndex((section) => section.id === sectionId);
      if (sectionIndex >= 0 && sectionIndex < settings.sections.length - 1) {
        const [section] = settings.sections.splice(sectionIndex, 1);
        settings.sections.splice(sectionIndex + 1, 0, section);
      }
    });
  }

  if (target.matches(".remove-section-button") && sectionId) {
    const shouldRemove = window.confirm(
      "Após remover esta etapa não será possível reverter. Tem certeza?",
    );

    if (!shouldRemove) {
      return;
    }

    mutateSettingsStructure((settings) => {
      if (settings.sections.length === 1) {
        return;
      }

      settings.sections = settings.sections.filter((section) => section.id !== sectionId);
    });
  }

  if (target.matches(".add-alert-button") && sectionId) {
    mutateSettingsStructure((settings) => {
      const section = settings.sections.find((item) => item.id === sectionId);

      if (section && section.alerts.length < MAX_ALERTS_PER_SECTION) {
        section.alerts.push(createDefaultAlert(section.alerts.length));
      }
    });
  }

  if (target.matches(".remove-alert-button") && sectionId && alertId) {
    mutateSettingsStructure((settings) => {
      const section = settings.sections.find((item) => item.id === sectionId);

      if (section) {
        section.alerts = section.alerts.filter((alert) => alert.id !== alertId);
      }
    });
  }
}

function mutateSettingsStructure(mutator) {
  const settingsClone = structuredClone(app.state.settings);
  const hadActiveSession = hasActiveSession(app.state.runtime.session);

  mutator(settingsClone);

  app.state.settings = normalizeSettings(settingsClone);

  if (hadActiveSession) {
    app.state.runtime.session = resetSession();
    showToast("O cronômetro foi zerado porque o roteiro foi alterado.");
  }

  persistState();
  renderConfig();
  renderPresentation();
}

function handleAddSection() {
  mutateSettingsStructure((settings) => {
    settings.sections.push(createDefaultSection(settings.sections.length));
  });
}

function handleResetConfig() {
  const shouldReset = window.confirm(
    "Restaurar o modelo padrão e apagar o roteiro salvo neste navegador?",
  );

  if (!shouldReset) {
    return;
  }

  clearPersistedState();
  app.state = createDefaultAppState();
  app.loadStatus = "empty";
  app.saveStatus = "idle";
  app.lastRenderedSectionId = null;
  app.lastOvertimeState = false;
  void wakeLockController.release();
  void fullscreenController.exit();
  renderConfig();
  setView("edit");
  persistState();
  renderPresentation();
  showToast("O modelo padrão foi restaurado.");
}

async function openPresentationMode() {
  if (!canStartPresentation(app.state.settings)) {
    showToast("Revise o roteiro. É preciso ter ao menos uma etapa com duração maior que zero.");
    return;
  }

  setView("presentation");
  renderPresentation();

  if (app.state.settings.autoStartOnOpen) {
    startPresentationSession();
    return;
  }

  if (app.state.settings.autoFullscreen) {
    await ensurePresentationFullscreen();
  }
}

function setView(view, { persist = true } = {}) {
  app.state.runtime.view = view;
  document.body.dataset.view = view;
  elements.configView.classList.toggle("hidden", view !== "edit");
  elements.presentationView.classList.toggle("hidden", view !== "presentation");

  if (persist) {
    persistState();
  }

  syncRenderLoop();
}

function handleStartPresentation() {
  if (!canStartPresentation(app.state.settings)) {
    showToast("Revise o roteiro antes de iniciar.");
    return;
  }

  startPresentationSession();
}

function startPresentationSession() {
  app.state.runtime.session = startSession(Date.now());
  app.lastRenderedSectionId = null;
  app.lastOvertimeState = false;
  persistState();
  renderPresentation();
  syncRenderLoop();
  void activatePresentationEnvironment();
}

function handlePausePresentation() {
  app.state.runtime.session = pauseSession(app.state.runtime.session, Date.now());
  persistState();
  renderPresentation();
  syncRenderLoop();
}

function handleResumePresentation() {
  app.state.runtime.session = resumeSession(app.state.runtime.session, Date.now());
  persistState();
  renderPresentation();
  syncRenderLoop();
  void activatePresentationEnvironment();
}

function handleResetPresentation() {
  app.state.runtime.session = resetSession();
  app.lastRenderedSectionId = null;
  app.lastOvertimeState = false;
  persistState();
  renderPresentation();
  syncRenderLoop();
}

async function handleToggleFullscreen() {
  const result = await fullscreenController.toggle(elements.presentationView);

  if (result.code === "install-required") {
    showToast(
      "No iPhone e no iPad, abra o app pela Tela de Início para usar sem as barras do navegador.",
    );
  }

  if (result.code === "unsupported") {
    showToast("Tela cheia indisponível neste navegador. Use a visualização normal.");
  }

  if (result.code === "blocked") {
    showToast("O navegador bloqueou a tela cheia. Tente novamente com um clique direto.");
  }

  renderPresentation();
}

async function handleToggleWakeLock() {
  const wantsKeepAwake = !app.state.settings.keepScreenAwake;
  app.state.settings = normalizeSettings({
    ...app.state.settings,
    keepScreenAwake: wantsKeepAwake,
  });
  persistState();
  updateConfigWakeLockButton();

  if (!wantsKeepAwake) {
    await wakeLockController.release();
    showToast("Tela ligada desativada.");
    renderPresentation();
    return;
  }

  if (app.state.runtime.view !== "presentation") {
    showToast("Tela ligada será usada ao iniciar a apresentação.");
    renderPresentation();
    return;
  }

  const result = await wakeLockController.request();

  if (result.code === "unsupported") {
    showToast("Wake lock indisponível. Ajuste brilho e energia manualmente se necessário.");
  }

  if (result.code === "blocked") {
    showToast("O navegador não conseguiu manter a tela ligada. Verifique permissões e economia de energia.");
  }

  if (result.code === "active") {
    showToast("Wake lock ativo enquanto o navegador permitir.");
  }

  renderPresentation();
}

async function handleReturnToEditMode() {
  if (app.state.runtime.session.status === "running") {
    app.state.runtime.session = pauseSession(app.state.runtime.session, Date.now());
    showToast("A apresentação foi pausada ao voltar para a edição.");
  }

  await wakeLockController.release();
  await fullscreenController.exit();
  setView("edit");
  persistState();
  renderConfig();
  renderPresentation();
}

async function activatePresentationEnvironment() {
  const fullscreenResult = app.state.settings.autoFullscreen
    ? await ensurePresentationFullscreen({ renderAfter: false })
    : {
        ok: true,
        code: app.fullscreenState.active ? "active" : "inactive",
      };
  const wakeLockResult = app.state.settings.keepScreenAwake
    ? app.wakeLockState.active
      ? { ok: true, code: "active" }
      : await wakeLockController.request()
    : app.wakeLockState.active || app.wakeLockState.shouldPersist
      ? await wakeLockController.release()
      : { ok: true, code: "inactive" };

  if (wakeLockResult.code === "unsupported") {
    showToast("Wake lock indisponível. Ajuste brilho e energia manualmente se necessário.");
  }

  if (wakeLockResult.code === "blocked") {
    showToast("O navegador não conseguiu manter a tela ligada. Verifique permissões e economia de energia.");
  }

  renderPresentation();
}

async function ensurePresentationFullscreen({ renderAfter = true } = {}) {
  const fullscreenResult = app.fullscreenState.active
    ? { ok: true, code: "active" }
    : await fullscreenController.enter(elements.presentationView);

  if (fullscreenResult.code === "install-required") {
    showToast(
      "No iPhone e no iPad, abra o app pela Tela de Início para usar sem as barras do navegador.",
    );
  }

  if (fullscreenResult.code === "unsupported") {
    showToast("Tela cheia indisponível neste navegador. Use a visualização normal.");
  }

  if (fullscreenResult.code === "blocked") {
    showToast("O navegador bloqueou a tela cheia. Tente novamente com um clique direto.");
  }

  if (renderAfter) {
    renderPresentation();
  }

  return fullscreenResult;
}

function renderPresentation() {
  const { settings, runtime } = app.state;
  const snapshot = derivePresentationSnapshot(settings, runtime.session, Date.now());
  const theme = getThemeMeta(settings.themeId);
  const currentSectionLabel = snapshot.currentSection
    ? getSectionLabel(snapshot.currentSection, snapshot.currentSectionIndex)
    : "Aguardando início";
  const nextSectionLabel = snapshot.nextSection
    ? getSectionLabel(snapshot.nextSection, snapshot.currentSectionIndex + 1)
    : "Fim";
  const presentationHeader = getPresentationHeader(
    currentSectionLabel,
    nextSectionLabel,
    settings,
  );
  const sectionTimerMs = snapshot.currentSectionRemainingMs;
  const totalTimerMs = snapshot.routeRemainingMs;
  const activeAlert = snapshot.activeAlerts.at(-1) ?? null;
  const shouldShowMain = !snapshot.isFinalOvertime;
  const canStart = canStartPresentation(settings);

  elements.presentationView.dataset.theme = theme.id;
  elements.presentationView.dataset.session = runtime.session.status;
  elements.presentationTitleDisplay.textContent =
    settings.presentationTitle || "Apresentação sem título";
  elements.themeChip.textContent = `Tema: ${theme.label}`;
  elements.visibilityChip.textContent =
    document.visibilityState === "visible" ? "Aba visível" : "Aba em segundo plano";
  elements.modeSummary.textContent = "Contagem regressiva da etapa e do total.";

  if (!canStart) {
    const layoutMode = settings.showPresentationTimer ? "dual" : "single";
    elements.currentSectionTitle.textContent = presentationHeader || "Revise o roteiro";
    elements.currentSectionTitle.classList.toggle("hidden", !presentationHeader);
    elements.sectionTimerLabel.textContent = "Restante da etapa";
    elements.sectionTimerValue.textContent = "00:00";
    elements.sectionTimerValue.classList.remove("timer-value-alert");
    elements.sectionTimerValue.style.removeProperty("--timer-alert-color");
    elements.totalTimerLabel.textContent = "Restante do total";
    elements.totalTimerValue.textContent = "00:00";
    elements.presentationMain.dataset.layout = layoutMode;
    elements.timerStack.dataset.layout = layoutMode;
    elements.totalTimerPanel.classList.toggle("hidden", layoutMode === "single");
    elements.presentationMain.classList.remove("hidden");
    elements.overtimeScreen.classList.add("hidden");
    updateCapabilityChips();
    updatePresentationControls(snapshot, canStart);
    syncRenderLoop();
    return;
  }

  elements.currentSectionTitle.textContent = presentationHeader;
  elements.currentSectionTitle.classList.toggle("hidden", !presentationHeader);
  elements.sectionTimerLabel.textContent = "Restante da etapa";
  elements.totalTimerLabel.textContent = "Restante do total";
  const isLastSection = Boolean(snapshot.currentSection) && !snapshot.nextSection;
  const shouldShowGlobalTimer = settings.showPresentationTimer && !isLastSection;
  const layoutMode = shouldShowGlobalTimer ? "dual" : "single";
  elements.presentationMain.dataset.layout = layoutMode;
  elements.timerStack.dataset.layout = layoutMode;
  elements.totalTimerPanel.classList.toggle("hidden", !shouldShowGlobalTimer);
  elements.sectionTimerValue.textContent = snapshot.currentSection
    ? formatClockMilliseconds(sectionTimerMs, "countdown")
    : "00:00";
  elements.totalTimerValue.textContent = formatClockMilliseconds(totalTimerMs, "countdown");

  elements.presentationMain.classList.toggle("hidden", !shouldShowMain);
  elements.overtimeScreen.classList.toggle("hidden", shouldShowMain);

  if (snapshot.isFinalOvertime) {
    elements.overtimeValue.textContent = formatClockMilliseconds(
      -snapshot.finalOvertimeMs,
      "countdown",
    );
  }

  if (activeAlert) {
    elements.sectionTimerValue.classList.add("timer-value-alert");
    elements.sectionTimerValue.style.setProperty("--timer-alert-color", activeAlert.color);
  } else {
    elements.sectionTimerValue.classList.remove("timer-value-alert");
    elements.sectionTimerValue.style.removeProperty("--timer-alert-color");
  }

  updateCapabilityChips();
  updatePresentationControls(snapshot, canStart);
  announcePresentationTransitions(snapshot);
  syncRenderLoop();
}

function getSectionLabel(section, index) {
  return section.title || `Etapa ${index + 1}`;
}

function getPresentationHeader(currentSectionLabel, nextSectionLabel, settings) {
  const parts = [];

  if (settings.showCurrentSection) {
    parts.push(currentSectionLabel);
  }

  if (settings.showNextSection) {
    parts.push(nextSectionLabel);
  }

  return parts.join(" -> ");
}

function updateCapabilityChips() {
  const fullscreenText = app.fullscreenState.standalone
    ? "Aberto da tela inicial"
    : app.fullscreenState.active
      ? "Tela cheia ativa"
      : app.fullscreenState.requestSupported
        ? "Tela cheia pronta"
        : app.fullscreenState.installHint === "ios-home-screen"
          ? "Use a tela inicial no iPhone"
          : "Tela cheia indisponível";
  const wakeLockText = app.wakeLockState.active
    ? "Wake lock ativo"
    : app.wakeLockState.supported
      ? app.wakeLockState.shouldPersist
        ? "Wake lock aguardando foco"
        : "Wake lock pronto"
      : "Wake lock indisponível";

  elements.fullscreenChip.textContent = fullscreenText;
  elements.wakeLockChip.textContent = wakeLockText;
}

function updatePresentationControls(snapshot, canStart) {
  const sessionStatus = app.state.runtime.session.status;

  const shouldShowStart = canStart && sessionStatus === "idle";
  const shouldShowPause = sessionStatus === "running";
  const shouldShowResume = sessionStatus === "paused";
  const shouldShowReset = !(sessionStatus === "idle" && snapshot.totalElapsedMs === 0);
  const shouldShowFullscreen = app.fullscreenState.requestSupported && !app.fullscreenState.standalone;

  elements.startButton.classList.toggle("hidden", !shouldShowStart);
  elements.pauseButton.classList.toggle("hidden", !shouldShowPause);
  elements.resumeButton.classList.toggle("hidden", !shouldShowResume);
  elements.resetButton.classList.toggle("hidden", !shouldShowReset);
  elements.fullscreenButton.classList.toggle("hidden", !shouldShowFullscreen);
  elements.fullscreenButton.textContent = app.fullscreenState.active
    ? "Sair da tela cheia"
    : "Tela cheia";
}

function announcePresentationTransitions(snapshot) {
  if (app.state.runtime.view !== "presentation") {
    return;
  }

  if (app.state.runtime.session.status !== "running") {
    app.lastRenderedSectionId = snapshot.currentSection?.id ?? null;
    app.lastOvertimeState = snapshot.isFinalOvertime;
    return;
  }

  if (snapshot.isFinalOvertime && !app.lastOvertimeState) {
    showToast("Roteiro concluído. O app entrou em overtime.");
  }

  if (
    snapshot.currentSection &&
    app.lastRenderedSectionId &&
    snapshot.currentSection.id !== app.lastRenderedSectionId
  ) {
    showToast(`Nova etapa: ${getSectionLabel(snapshot.currentSection, snapshot.currentSectionIndex)}`);
  }

  app.lastRenderedSectionId = snapshot.currentSection?.id ?? null;
  app.lastOvertimeState = snapshot.isFinalOvertime;
}

function syncRenderLoop() {
  const shouldRun =
    app.state.runtime.view === "presentation" && app.state.runtime.session.status === "running";

  if (shouldRun) {
    startRenderLoop();
  } else {
    stopRenderLoop();
  }
}

function startRenderLoop() {
  if (app.frameId) {
    return;
  }

  const tick = () => {
    renderPresentation();

    if (
      app.state.runtime.view === "presentation" &&
      app.state.runtime.session.status === "running"
    ) {
      app.frameId = window.requestAnimationFrame(tick);
    } else {
      app.frameId = 0;
    }
  };

  app.frameId = window.requestAnimationFrame(tick);
}

function stopRenderLoop() {
  if (!app.frameId) {
    return;
  }

  window.cancelAnimationFrame(app.frameId);
  app.frameId = 0;
}

function persistState() {
  const result = savePersistedState(app.state);
  app.saveStatus = result.status;
  refreshConfigSummary();
}

function showToast(message) {
  if (!message) {
    return;
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  elements.toastRegion.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
}

function handleFullscreenChange(nextState) {
  app.fullscreenState = nextState;
  renderPresentation();
}

function handleWakeLockChange(nextState) {
  const previousState = app.wakeLockState;
  app.wakeLockState = {
    ...previousState,
    ...nextState,
  };

  if (nextState.code === "released") {
    showToast("O navegador liberou o wake lock. Vamos tentar de novo quando a aba voltar ao foco.");
  }

  updateConfigWakeLockButton();
  renderPresentation();
}

async function handleVisibilityChange() {
  const wasHidden = app.wasHidden;
  app.wasHidden = document.visibilityState === "hidden";

  if (document.visibilityState === "visible") {
    await wakeLockController.syncWithVisibility();

    if (wasHidden && hasActiveSession(app.state.runtime.session)) {
      showToast("A aba voltou ao foco. O tempo foi recalculado a partir do relógio do sistema.");
    }
  }

  renderPresentation();
}

function handlePresentationShortcuts(event) {
  if (app.state.runtime.view !== "presentation") {
    return;
  }

  const target = event.target;

  if (
    target instanceof HTMLElement &&
    ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)
  ) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();

    if (app.state.runtime.session.status === "idle") {
      handleStartPresentation();
    } else if (app.state.runtime.session.status === "running") {
      handlePausePresentation();
    } else {
      handleResumePresentation();
    }
  }

  if (event.code === "KeyF") {
    event.preventDefault();
    void handleToggleFullscreen();
  }
}

function updateConfigWakeLockButton() {
  const isEnabled = app.state.settings.keepScreenAwake;
  elements.configWakeLockButton.setAttribute("aria-pressed", String(isEnabled));
  elements.configWakeLockButton.classList.toggle("switch-button-active", isEnabled);
}

function updateThemeSwitchGroup(activeThemeId) {
  const themeButtons = elements.themeSwitchGroup.querySelectorAll("[data-theme-choice]");

  for (const themeButton of themeButtons) {
    const isActive = themeButton.dataset.themeChoice === activeThemeId;
    themeButton.setAttribute("aria-pressed", String(isActive));
    themeButton.classList.toggle("theme-switch-option-active", isActive);
  }
}
