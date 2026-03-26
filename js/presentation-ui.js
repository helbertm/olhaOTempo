import {
  canStartPresentation,
  getThemeMeta,
} from "./model.js";
import { derivePresentationSnapshot } from "./timer-engine.js";
import { formatClockMilliseconds } from "./time.js";

export function renderPresentation({
  app,
  elements,
  showToast,
}) {
  const snapshot = derivePresentationSnapshot(
    app.state.settings,
    app.state.runtime.session,
    Date.now(),
  );
  const viewModel = derivePresentationViewModel({ app, snapshot });

  renderPresentationStructure({ app, elements }, viewModel);
  renderPresentationClocks({ app, elements }, viewModel);
  renderPresentationAlert({ app, elements }, viewModel);
  announcePresentationTransitions({ app, showToast }, snapshot);

  return snapshot;
}

export function getNextPresentationUpdateDelay(snapshot) {
  if (!snapshot) {
    return 1000;
  }

  const remainder = snapshot.totalElapsedMs % 1000;
  return remainder === 0 ? 1000 : 1000 - remainder;
}

export function getSectionLabel(section, index) {
  return section.title || `Etapa ${index + 1}`;
}

export function getPresentationHeader(currentSectionLabel, nextSectionLabel, settings) {
  const parts = [];

  if (settings.showCurrentSection) {
    parts.push(currentSectionLabel);
  }

  if (settings.showNextSection) {
    parts.push(nextSectionLabel);
  }

  return parts.join(" -> ");
}

export function derivePresentationViewModel({
  app,
  snapshot,
  visibilityState = typeof document === "undefined" ? "visible" : document.visibilityState,
}) {
  const { settings, runtime } = app.state;
  const theme = getThemeMeta(settings.themeId);
  const currentSectionLabel = snapshot.currentSection
    ? getSectionLabel(snapshot.currentSection, snapshot.currentSectionIndex)
    : "Aguardando início";
  const nextSectionLabel = snapshot.nextSection
    ? getSectionLabel(snapshot.nextSection, snapshot.currentSectionIndex + 1)
    : "Fim";
  const headerText = getPresentationHeader(currentSectionLabel, nextSectionLabel, settings);
  const canStart = canStartPresentation(settings);
  const isLastSection = Boolean(snapshot.currentSection) && !snapshot.nextSection;
  const showGlobalTimer = settings.showPresentationTimer && !isLastSection;
  const layoutMode = showGlobalTimer ? "dual" : "single";
  const contentLayout = getContentLayout({
    viewportMode: app.presentationViewportMode,
    isFinalOvertime: snapshot.isFinalOvertime,
  });
  const titleDensity = getTitleDensity({
    headerText,
    viewportMode: app.presentationViewportMode,
  });
  const activeAlert = snapshot.activeAlerts.at(-1) ?? null;
  const controls = buildControlState({
    app,
    snapshot,
    canStart,
    viewportMode: app.presentationViewportMode,
  });
  const fullscreenText = getFullscreenChipText(app);
  const wakeLockText = getWakeLockChipText(app);
  const visibilityText = visibilityState === "visible"
    ? "Aba visível"
    : "Aba em segundo plano";
  const sectionTimerText = snapshot.currentSection
    ? formatClockMilliseconds(snapshot.currentSectionRemainingMs, "countdown")
    : "00:00";
  const totalTimerText = canStart
    ? formatClockMilliseconds(snapshot.routeRemainingMs, "countdown")
    : "00:00";
  const overtimeText = snapshot.isFinalOvertime
    ? formatClockMilliseconds(-snapshot.finalOvertimeMs, "countdown")
    : "";
  const modeSummaryText = snapshot.isFinalOvertime
    ? "Contagem do overtime final."
    : showGlobalTimer
      ? "Contagem regressiva da etapa e do total."
      : "Contagem regressiva da etapa atual.";

  return {
    canStart,
    themeId: theme.id,
    sessionStatus: runtime.session.status,
    viewportMode: app.presentationViewportMode,
    titleText: settings.presentationTitle || "Apresentação sem título",
    themeText: `Tema: ${theme.label}`,
    visibilityText,
    fullscreenText,
    wakeLockText,
    modeSummaryText,
    headerText: canStart ? headerText : headerText || "Revise o roteiro",
    showHeader: Boolean(headerText),
    presentationState: snapshot.isFinalOvertime ? "overtime" : layoutMode,
    contentLayout,
    titleDensity,
    layoutMode,
    showMain: !snapshot.isFinalOvertime,
    showOvertime: snapshot.isFinalOvertime,
    showGlobalTimer,
    sectionTimerText,
    totalTimerText,
    overtimeText,
    alertColor: activeAlert?.color ?? "",
    hasAlert: Boolean(activeAlert),
    controls,
  };
}

function buildControlState({
  app,
  snapshot,
  canStart,
  viewportMode,
}) {
  const sessionStatus = app.state.runtime.session.status;

  return {
    showStart: canStart && sessionStatus === "idle",
    showPause: sessionStatus === "running",
    showResume: sessionStatus === "paused",
    showReset: !(sessionStatus === "idle" && snapshot.totalElapsedMs === 0),
    showFullscreen: app.fullscreenState.requestSupported && !app.fullscreenState.standalone,
    fullscreenLabel: app.fullscreenState.active ? "Sair da tela cheia" : "Tela cheia",
    layout: getControlsLayout(viewportMode),
  };
}

function renderPresentationStructure({ app, elements }, viewModel) {
  const structureKey = [
    viewModel.themeId,
    viewModel.sessionStatus,
    viewModel.viewportMode,
    viewModel.titleText,
    viewModel.themeText,
    viewModel.visibilityText,
    viewModel.fullscreenText,
    viewModel.wakeLockText,
    viewModel.headerText,
    viewModel.showHeader,
    viewModel.presentationState,
    viewModel.contentLayout,
    viewModel.titleDensity,
    viewModel.layoutMode,
    viewModel.showMain,
    viewModel.showOvertime,
    viewModel.showGlobalTimer,
    viewModel.controls.showStart,
    viewModel.controls.showPause,
    viewModel.controls.showResume,
    viewModel.controls.showReset,
    viewModel.controls.showFullscreen,
    viewModel.controls.fullscreenLabel,
    viewModel.controls.layout,
  ].join("|");

  if (app.presentationRenderCache.structureKey === structureKey) {
    return;
  }

  app.presentationRenderCache.structureKey = structureKey;

  elements.presentationView.dataset.theme = viewModel.themeId;
  elements.presentationView.dataset.session = viewModel.sessionStatus;
  elements.presentationView.dataset.viewportMode = viewModel.viewportMode;
  elements.presentationView.dataset.presentationState = viewModel.presentationState;
  elements.presentationView.dataset.timerLayout = viewModel.layoutMode;
  elements.presentationView.dataset.contentLayout = viewModel.contentLayout;
  elements.presentationView.dataset.titleDensity = viewModel.titleDensity;
  elements.presentationView.dataset.controlsLayout = viewModel.controls.layout;
  elements.presentationMain.dataset.layout = viewModel.layoutMode;
  elements.timerStack.dataset.layout = viewModel.layoutMode;

  applyText(elements.presentationTitleDisplay, viewModel.titleText);
  applyText(elements.themeChip, viewModel.themeText);
  applyText(elements.visibilityChip, viewModel.visibilityText);
  applyText(elements.fullscreenChip, viewModel.fullscreenText);
  applyText(elements.wakeLockChip, viewModel.wakeLockText);
  applyText(elements.modeSummary, viewModel.modeSummaryText);
  applyText(elements.currentSectionTitle, viewModel.headerText);
  applyText(elements.sectionTimerLabel, "Restante da etapa");
  applyText(elements.totalTimerLabel, "Restante do total");
  applyHidden(elements.currentSectionTitle, !viewModel.showHeader);
  applyHidden(elements.totalTimerPanel, !viewModel.showGlobalTimer);
  applyHidden(elements.presentationMain, !viewModel.showMain);
  applyHidden(elements.overtimeScreen, !viewModel.showOvertime);

  updatePresentationControls(elements, viewModel.controls);
}

function renderPresentationClocks({ app, elements }, viewModel) {
  if (app.presentationRenderCache.sectionTimerText !== viewModel.sectionTimerText) {
    applyText(elements.sectionTimerValue, viewModel.sectionTimerText);
    app.presentationRenderCache.sectionTimerText = viewModel.sectionTimerText;
  }

  if (app.presentationRenderCache.totalTimerText !== viewModel.totalTimerText) {
    applyText(elements.totalTimerValue, viewModel.totalTimerText);
    app.presentationRenderCache.totalTimerText = viewModel.totalTimerText;
  }

  if (viewModel.showOvertime && app.presentationRenderCache.overtimeText !== viewModel.overtimeText) {
    applyText(elements.overtimeValue, viewModel.overtimeText);
    app.presentationRenderCache.overtimeText = viewModel.overtimeText;
  }

  if (!viewModel.showOvertime && app.presentationRenderCache.overtimeText) {
    app.presentationRenderCache.overtimeText = "";
  }
}

function renderPresentationAlert({ app, elements }, viewModel) {
  const alertKey = `${viewModel.hasAlert ? "active" : "idle"}|${viewModel.alertColor}`;

  if (app.presentationRenderCache.alertKey === alertKey) {
    return;
  }

  app.presentationRenderCache.alertKey = alertKey;

  if (viewModel.hasAlert) {
    elements.sectionTimerValue.classList.add("timer-value-alert");
    elements.sectionTimerValue.style.setProperty("--timer-alert-color", viewModel.alertColor);
  } else {
    elements.sectionTimerValue.classList.remove("timer-value-alert");
    elements.sectionTimerValue.style.removeProperty("--timer-alert-color");
  }
}

function updatePresentationControls(elements, controls) {
  applyHidden(elements.startButton, !controls.showStart);
  applyHidden(elements.pauseButton, !controls.showPause);
  applyHidden(elements.resumeButton, !controls.showResume);
  applyHidden(elements.resetButton, !controls.showReset);
  applyHidden(elements.fullscreenButton, !controls.showFullscreen);
  applyText(elements.fullscreenButton, controls.fullscreenLabel);
}

function announcePresentationTransitions({ app, showToast }, snapshot) {
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

function getFullscreenChipText(app) {
  if (app.fullscreenState.standalone) {
    return "Aberto da tela inicial";
  }

  if (app.fullscreenState.active) {
    return "Tela cheia ativa";
  }

  if (app.fullscreenState.requestSupported) {
    return "Tela cheia pronta";
  }

  if (app.fullscreenState.installHint === "ios-home-screen") {
    return "Use a tela inicial no iPhone";
  }

  return "Tela cheia indisponível";
}

function getWakeLockChipText(app) {
  if (app.wakeLockState.active) {
    return "Wake lock ativo";
  }

  if (!app.wakeLockState.supported) {
    return "Wake lock indisponível";
  }

  return app.wakeLockState.shouldPersist
    ? "Wake lock aguardando foco"
    : "Wake lock pronto";
}

function getControlsLayout(viewportMode) {
  if (viewportMode === "compact-portrait") {
    return "compact-grid";
  }

  if (viewportMode === "compact-landscape") {
    return "compact-inline";
  }

  return "inline";
}

function getContentLayout({
  viewportMode,
  isFinalOvertime,
}) {
  if (isFinalOvertime) {
    return "stacked";
  }

  return viewportMode === "compact-landscape" ? "split" : "stacked";
}

function getTitleDensity({
  headerText,
  viewportMode,
}) {
  const text = headerText.trim().replace(/\s+/g, " ");
  const textLength = text.length;

  if (textLength === 0) {
    return "default";
  }

  if (viewportMode === "compact-landscape") {
    if (textLength >= 28) {
      return "tight";
    }

    if (textLength >= 16) {
      return "compact";
    }

    return "default";
  }

  if (viewportMode === "compact-portrait") {
    if (textLength >= 42) {
      return "tight";
    }

    if (textLength >= 24) {
      return "compact";
    }

    return "default";
  }

  return textLength >= 52 ? "compact" : "default";
}

function applyText(node, value) {
  if (node.textContent !== value) {
    node.textContent = value;
  }
}

function applyHidden(node, hidden) {
  node.classList.toggle("hidden", hidden);
}
