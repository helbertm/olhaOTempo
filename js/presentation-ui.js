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
  syncRenderLoop,
}) {
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
  elements.presentationView.dataset.viewportMode = app.presentationViewportMode;
  elements.presentationTitleDisplay.textContent =
    settings.presentationTitle || "Apresentação sem título";
  elements.themeChip.textContent = `Tema: ${theme.label}`;
  elements.visibilityChip.textContent =
    document.visibilityState === "visible" ? "Aba visível" : "Aba em segundo plano";
  elements.modeSummary.textContent = "Contagem regressiva da etapa e do total.";

  if (!canStart) {
    const layoutMode = settings.showPresentationTimer ? "dual" : "single";
    elements.presentationView.dataset.presentationState = "idle";
    elements.presentationView.dataset.timerLayout = layoutMode;
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
    updateCapabilityChips({ app, elements });
    updatePresentationControls({ app, elements }, snapshot, canStart);
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
  elements.presentationView.dataset.presentationState = snapshot.isFinalOvertime
    ? "overtime"
    : layoutMode;
  elements.presentationView.dataset.timerLayout = layoutMode;
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

  updateCapabilityChips({ app, elements });
  updatePresentationControls({ app, elements }, snapshot, canStart);
  announcePresentationTransitions({ app, showToast }, snapshot);
  syncRenderLoop();
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

function updateCapabilityChips({ app, elements }) {
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

function updatePresentationControls({ app, elements }, snapshot, canStart) {
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
