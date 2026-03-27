export function initializeApp({
  app,
  loadStatus,
  populateStaticOptions,
  updatePresentationViewportMode,
  canStartPresentation,
  resetSession,
  renderConfig,
  setView,
  renderPresentation,
  showToast,
}) {
  populateStaticOptions();
  updatePresentationViewportMode();

  if (app.state.runtime.view === "presentation" && !canStartPresentation(app.state.settings)) {
    app.state.runtime.view = "edit";
    app.state.runtime.session = resetSession();
  }

  renderConfig();
  setView(app.state.runtime.view, { persist: false });
  renderPresentation();

  if (loadStatus === "recovered") {
    showToast("Um salvamento inválido foi ignorado e o app voltou para um modelo seguro.");
  }

  if (loadStatus === "unavailable") {
    showToast("O armazenamento local não está disponível. As mudanças podem se perder ao fechar a página.");
  }

  if (app.state.runtime.view === "presentation" && app.state.runtime.session.status === "running") {
    showToast("A apresentação foi recuperada a partir do estado salvo neste navegador.");
  }
}

export function attachEventListeners({ elements, handlers }) {
  elements.addSectionButton.addEventListener("click", handlers.handleAddSection);
  elements.openPresentationButton.addEventListener("click", handlers.openPresentationMode);
  elements.quickStartButton.addEventListener("click", handlers.openPresentationMode);
  elements.themeSwitchGroup.addEventListener("click", handlers.handleThemeSwitchClick);
  elements.themeSwitchGroup.addEventListener("keydown", handlers.handleThemeSwitchKeydown);
  elements.resetConfigButton.addEventListener("click", handlers.handleResetConfig);
  elements.backToTopButton.addEventListener("click", handlers.handleBackToTopClick);

  elements.configView.addEventListener("input", handlers.handleConfigInput);
  elements.configView.addEventListener("change", handlers.handleConfigChange);
  elements.sectionList.addEventListener("click", handlers.handleSectionListClick);

  elements.startButton.addEventListener("click", handlers.handleStartPresentation);
  elements.pauseButton.addEventListener("click", handlers.handlePausePresentation);
  elements.resumeButton.addEventListener("click", handlers.handleResumePresentation);
  elements.resetButton.addEventListener("click", handlers.handleResetPresentation);
  elements.fullscreenButton.addEventListener("click", handlers.handleToggleFullscreen);
  elements.editModeButton.addEventListener("click", handlers.handleReturnToEditMode);

  window.addEventListener("scroll", handlers.handleWindowScroll, { passive: true });
  window.addEventListener("resize", handlers.handleViewportChange, { passive: true });
  window.visualViewport?.addEventListener("resize", handlers.handleViewportChange);
  document.addEventListener("visibilitychange", handlers.handleVisibilityChange);
  document.addEventListener("keydown", handlers.handlePresentationShortcuts);
}
