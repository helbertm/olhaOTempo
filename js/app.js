import {
  FullscreenController,
  WakeLockController,
} from "./capabilities.js";
import { elements } from "./dom.js";
import { canStartPresentation } from "./model.js";
import { showToast as showToastNotification } from "./notifications.js";
import { initializeApp, attachEventListeners } from "./app-bootstrap.js";
import {
  activatePresentationEnvironment,
  ensurePresentationFullscreen,
  handleFullscreenChange as handleFullscreenChangeAction,
  handlePausePresentation as handlePausePresentationAction,
  handlePresentationShortcuts as handlePresentationShortcutsAction,
  handleResetConfig as handleResetConfigAction,
  handleResetPresentation as handleResetPresentationAction,
  handleResumePresentation as handleResumePresentationAction,
  handleReturnToEditMode as handleReturnToEditModeAction,
  handleStartPresentation as handleStartPresentationAction,
  handleToggleFullscreen as handleToggleFullscreenAction,
  handleToggleWakeLock as handleToggleWakeLockAction,
  handleViewportChange as handleViewportChangeAction,
  handleVisibilityChange as handleVisibilityChangeAction,
  handleWakeLockChange as handleWakeLockChangeAction,
  openPresentationMode as openPresentationModeAction,
  setView,
  startPresentationSession as startPresentationSessionAction,
  updatePresentationViewportMode as updatePresentationViewportModeAction,
} from "./presentation-controls.js";
import {
  getNextPresentationUpdateDelay,
  renderPresentation as renderPresentationUi,
} from "./presentation-ui.js";
import {
  handleAddSection as handleAddSectionAction,
  handleSectionListClick as handleSectionListClickAction,
  mutateSettingsStructure,
  persistState,
  syncSettingsFromDom,
} from "./state-sync.js";
import { loadPersistedState } from "./storage.js";
import { resetSession } from "./timer-engine.js";
import {
  populateStaticOptions,
  refreshConfigSummary,
  renderConfig as renderConfigUi,
  updateConfigWakeLockButton,
  updateDocumentTitle,
} from "./ui-config.js";

const loadResult = loadPersistedState();

const app = {
  state: loadResult.state,
  loadStatus: loadResult.status,
  saveStatus: "idle",
  renderTimerId: 0,
  lastPresentationSnapshot: null,
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
  presentationViewportMode: "desktop",
  presentationRenderCache: {
    structureKey: "",
    sectionTimerText: "",
    totalTimerText: "",
    overtimeText: "",
    alertKey: "",
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

initializeApp({
  app,
  loadStatus: app.loadStatus,
  populateStaticOptions: () => populateStaticOptions(elements),
  updatePresentationViewportMode,
  canStartPresentation,
  resetSession,
  renderConfig: renderConfigView,
  setView: setCurrentView,
  renderPresentation: renderPresentationView,
  showToast: showToastMessage,
});

attachEventListeners({
  elements,
  handlers: {
    handleAddSection,
    openPresentationMode,
    handleToggleWakeLock,
    handleThemeSwitchClick,
    handleResetConfig,
    handleConfigInput,
    handleConfigChange,
    handleSectionListClick,
    handleStartPresentation,
    handlePausePresentation,
    handleResumePresentation,
    handleResetPresentation,
    handleToggleFullscreen,
    handleReturnToEditMode,
    handleViewportChange,
    handleVisibilityChange,
    handlePresentationShortcuts,
  },
});

function renderConfigView() {
  renderConfigUi({ app, elements });
}

function refreshConfigViewSummary() {
  refreshConfigSummary({ app, elements });
}

function updateConfigDocumentTitle() {
  updateDocumentTitle({ app, elements });
}

function renderPresentationView() {
  const snapshot = renderPresentationUi({
    app,
    elements,
    showToast: showToastMessage,
  });

  app.lastPresentationSnapshot = snapshot;
  syncRenderLoop();
  return snapshot;
}

function persistAppState() {
  persistState({
    app,
    refreshConfigSummary: refreshConfigViewSummary,
  });
}

function showToastMessage(message) {
  showToastNotification(elements, message);
}

function updateWakeLockToggle() {
  updateConfigWakeLockButton({ app, elements });
}

function updatePresentationViewportMode() {
  updatePresentationViewportModeAction({ app, elements });
}

function handleViewportChange() {
  handleViewportChangeAction({
    app,
    elements,
    renderPresentation: renderPresentationView,
  });
}

function setCurrentView(view, options) {
  setView(
    {
      app,
      elements,
      persistState: persistAppState,
      syncRenderLoop,
    },
    view,
    options,
  );
}

function ensureFullscreen(options) {
  return ensurePresentationFullscreen(
    {
      app,
      elements,
      fullscreenController,
      renderPresentation: renderPresentationView,
      showToast: showToastMessage,
    },
    options,
  );
}

function activateEnvironment() {
  return activatePresentationEnvironment({
    app,
    wakeLockController,
    ensurePresentationFullscreen: ensureFullscreen,
    showToast: showToastMessage,
    renderPresentation: renderPresentationView,
    wakeLockState: () => app.wakeLockState,
  });
}

function startPresentationSession() {
  startPresentationSessionAction({
    app,
    persistState: persistAppState,
    renderPresentation: renderPresentationView,
    syncRenderLoop,
    activatePresentationEnvironment: activateEnvironment,
  });
}

function mutateSettings(mutator) {
  mutateSettingsStructure({
    app,
    mutator,
    persistState: persistAppState,
    renderConfig: renderConfigView,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
}

function handleConfigInput(event) {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  syncSettingsFromDom({
    app,
    elements,
    rerender: false,
    persistState: persistAppState,
    renderConfig: renderConfigView,
    refreshConfigSummary: refreshConfigViewSummary,
    updateDocumentTitle: updateConfigDocumentTitle,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
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
      syncSettingsFromDom({
        app,
        elements,
        rerender: true,
        persistState: persistAppState,
        renderConfig: renderConfigView,
        refreshConfigSummary: refreshConfigViewSummary,
        updateDocumentTitle: updateConfigDocumentTitle,
        renderPresentation: renderPresentationView,
        showToast: showToastMessage,
      });
    }
  }
}

function handleConfigChange(event) {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  syncSettingsFromDom({
    app,
    elements,
    rerender: true,
    persistState: persistAppState,
    renderConfig: renderConfigView,
    refreshConfigSummary: refreshConfigViewSummary,
    updateDocumentTitle: updateConfigDocumentTitle,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
}

function handleSectionListClick(event) {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  handleSectionListClickAction({
    target,
    mutateSettingsStructure: mutateSettings,
  });
}

function handleAddSection() {
  handleAddSectionAction(mutateSettings);
}

function handleResetConfig() {
  void handleResetConfigAction({
    app,
    wakeLockController,
    fullscreenController,
    setView: setCurrentView,
    persistState: persistAppState,
    renderConfig: renderConfigView,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
}

function openPresentationMode() {
  return openPresentationModeAction({
    app,
    setView: setCurrentView,
    renderPresentation: renderPresentationView,
    startPresentationSession,
    ensurePresentationFullscreen: ensureFullscreen,
    showToast: showToastMessage,
  });
}

function handleStartPresentation() {
  handleStartPresentationAction({
    app,
    startPresentationSession,
    showToast: showToastMessage,
  });
}

function handlePausePresentation() {
  handlePausePresentationAction({
    app,
    persistState: persistAppState,
    renderPresentation: renderPresentationView,
    syncRenderLoop,
  });
}

function handleResumePresentation() {
  handleResumePresentationAction({
    app,
    persistState: persistAppState,
    renderPresentation: renderPresentationView,
    syncRenderLoop,
    activatePresentationEnvironment: activateEnvironment,
  });
}

function handleResetPresentation() {
  handleResetPresentationAction({
    app,
    persistState: persistAppState,
    renderPresentation: renderPresentationView,
    syncRenderLoop,
  });
}

function handleToggleFullscreen() {
  return handleToggleFullscreenAction({
    app,
    elements,
    fullscreenController,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
}

function handleToggleWakeLock() {
  return handleToggleWakeLockAction({
    app,
    wakeLockController,
    persistState: persistAppState,
    updateConfigWakeLockButton: updateWakeLockToggle,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
}

function handleReturnToEditMode() {
  return handleReturnToEditModeAction({
    app,
    wakeLockController,
    fullscreenController,
    setView: setCurrentView,
    persistState: persistAppState,
    renderConfig: renderConfigView,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
}

function handleFullscreenChange(nextState) {
  handleFullscreenChangeAction(
    {
      app,
      renderPresentation: renderPresentationView,
    },
    nextState,
  );
}

function handleWakeLockChange(nextState) {
  handleWakeLockChangeAction(
    {
      app,
      updateConfigWakeLockButton: updateWakeLockToggle,
      renderPresentation: renderPresentationView,
      showToast: showToastMessage,
    },
    nextState,
  );
}

function handleVisibilityChange() {
  return handleVisibilityChangeAction({
    app,
    wakeLockController,
    renderPresentation: renderPresentationView,
    showToast: showToastMessage,
  });
}

function handlePresentationShortcuts(event) {
  handlePresentationShortcutsAction(
    {
      app,
      handleStartPresentation,
      handlePausePresentation,
      handleResumePresentation,
      handleToggleFullscreen,
    },
    event,
  );
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
  if (!app.lastPresentationSnapshot) {
    renderPresentationView();
    return;
  }

  if (app.renderTimerId) {
    window.clearTimeout(app.renderTimerId);
  }

  app.renderTimerId = window.setTimeout(() => {
    app.renderTimerId = 0;
    renderPresentationView();
  }, getNextPresentationUpdateDelay(app.lastPresentationSnapshot));
}

function stopRenderLoop() {
  if (!app.renderTimerId) {
    return;
  }

  window.clearTimeout(app.renderTimerId);
  app.renderTimerId = 0;
}
