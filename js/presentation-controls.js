import { createDefaultAppState } from "./defaults.js";
import { canStartPresentation } from "./model.js";
import { getPresentationViewportMode } from "./presentation-layout.js";
import {
  hasActiveSession,
  pauseSession,
  resetSession,
  resumeSession,
  startSession,
} from "./timer-engine.js";
import { clearPersistedState } from "./storage.js";

export function setView({
  app,
  elements,
  persistState,
  syncRenderLoop,
}, view, { persist = true } = {}) {
  app.state.runtime.view = view;
  document.body.dataset.view = view;
  elements.configView.classList.toggle("hidden", view !== "edit");
  elements.presentationView.classList.toggle("hidden", view !== "presentation");

  if (persist) {
    persistState();
  }

  syncRenderLoop();
}

export async function openPresentationMode({
  app,
  setView,
  renderPresentation,
  startPresentationSession,
  ensurePresentationFullscreen,
  showToast,
}) {
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

export function handleStartPresentation({
  app,
  startPresentationSession,
  showToast,
}) {
  if (!canStartPresentation(app.state.settings)) {
    showToast("Revise o roteiro antes de iniciar.");
    return;
  }

  startPresentationSession();
}

export function startPresentationSession({
  app,
  persistState,
  renderPresentation,
  syncRenderLoop,
  activatePresentationEnvironment,
}) {
  app.state.runtime.session = startSession(Date.now());
  app.lastRenderedSectionId = null;
  app.lastOvertimeState = false;
  persistState();
  renderPresentation();
  syncRenderLoop();
  void activatePresentationEnvironment();
}

export function handlePausePresentation({
  app,
  persistState,
  renderPresentation,
  syncRenderLoop,
}) {
  app.state.runtime.session = pauseSession(app.state.runtime.session, Date.now());
  persistState();
  renderPresentation();
  syncRenderLoop();
}

export function handleResumePresentation({
  app,
  persistState,
  renderPresentation,
  syncRenderLoop,
  activatePresentationEnvironment,
}) {
  app.state.runtime.session = resumeSession(app.state.runtime.session, Date.now());
  persistState();
  renderPresentation();
  syncRenderLoop();
  void activatePresentationEnvironment();
}

export function handleResetPresentation({
  app,
  persistState,
  renderPresentation,
  syncRenderLoop,
}) {
  app.state.runtime.session = resetSession();
  app.lastRenderedSectionId = null;
  app.lastOvertimeState = false;
  persistState();
  renderPresentation();
  syncRenderLoop();
}

export async function handleToggleFullscreen({
  app,
  elements,
  fullscreenController,
  renderPresentation,
  showToast,
}) {
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

export async function handleReturnToEditMode({
  app,
  wakeLockController,
  fullscreenController,
  setView,
  persistState,
  renderConfig,
  renderPresentation,
  showToast,
}) {
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

export async function activatePresentationEnvironment({
  app,
  wakeLockController,
  ensurePresentationFullscreen,
  showToast,
  renderPresentation,
  wakeLockState,
}) {
  const fullscreenResult = app.state.settings.autoFullscreen
    ? await ensurePresentationFullscreen({ renderAfter: false })
    : {
        ok: true,
        code: app.fullscreenState.active ? "active" : "inactive",
      };
  const wakeLockResult = app.state.settings.keepScreenAwake
    ? wakeLockState().active
      ? { ok: true, code: "active" }
      : await wakeLockController.request()
    : wakeLockState().active || wakeLockState().shouldPersist
      ? await wakeLockController.release()
      : { ok: true, code: "inactive" };

  if (wakeLockResult.code === "unsupported") {
    showToast("Wake lock indisponível. Ajuste brilho e energia manualmente se necessário.");
  }

  if (wakeLockResult.code === "blocked") {
    showToast("O navegador não conseguiu manter a tela ligada. Verifique permissões e economia de energia.");
  }

  renderPresentation();
  return fullscreenResult;
}

export async function ensurePresentationFullscreen({
  app,
  elements,
  fullscreenController,
  renderPresentation,
  showToast,
}, { renderAfter = true } = {}) {
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

export function handleFullscreenChange({
  app,
  renderPresentation,
}, nextState) {
  app.fullscreenState = nextState;
  renderPresentation();
}

export function updatePresentationViewportMode({ app, elements }) {
  app.presentationViewportMode = getPresentationViewportMode(window);
  elements.presentationView.dataset.viewportMode = app.presentationViewportMode;
}

export function handleViewportChange({
  app,
  elements,
  renderPresentation,
}) {
  const nextViewportMode = getPresentationViewportMode(window);

  if (nextViewportMode === app.presentationViewportMode) {
    return;
  }

  app.presentationViewportMode = nextViewportMode;
  elements.presentationView.dataset.viewportMode = nextViewportMode;
  renderPresentation();
}

export function handleWakeLockChange({
  app,
  renderPresentation,
  showToast,
}, nextState) {
  const previousState = app.wakeLockState;
  app.wakeLockState = {
    ...previousState,
    ...nextState,
  };

  if (nextState.code === "released") {
    showToast("O navegador liberou o wake lock. Vamos tentar de novo quando a aba voltar ao foco.");
  }

  renderPresentation();
}

export async function handleVisibilityChange({
  app,
  wakeLockController,
  renderPresentation,
  showToast,
}) {
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

export function handlePresentationShortcuts({
  app,
  handleStartPresentation,
  handlePausePresentation,
  handleResumePresentation,
  handleToggleFullscreen,
}, event) {
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

export async function handleResetConfig({
  app,
  wakeLockController,
  fullscreenController,
  setView,
  persistState,
  renderConfig,
  renderPresentation,
  showToast,
}) {
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
