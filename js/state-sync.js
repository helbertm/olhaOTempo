import { MAX_ALERTS_PER_SECTION } from "./constants.js";
import {
  createDefaultAlert,
  createDefaultSection,
} from "./defaults.js";
import { normalizeSettings } from "./model.js";
import { savePersistedState } from "./storage.js";
import {
  hasActiveSession,
  resetSession,
} from "./timer-engine.js";
import {
  parseHoursMinutesSeconds,
  parseMinutesSeconds,
} from "./time.js";

export function syncSettingsFromDom({
  app,
  elements,
  rerender,
  persistState,
  renderConfig,
  refreshConfigSummary,
  updateDocumentTitle,
  renderPresentation,
  showToast,
}) {
  const previousSettings = JSON.stringify(app.state.settings);
  const nextSettings = normalizeSettings(serializeSettingsFromDom({ app, elements }));
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

export function serializeSettingsFromDom({ app, elements }) {
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

export function handleSectionListClick({
  target,
  mutateSettingsStructure,
}) {
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

export function mutateSettingsStructure({
  app,
  mutator,
  persistState,
  renderConfig,
  renderPresentation,
  showToast,
}) {
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

export function handleAddSection(mutateSettingsStructure) {
  mutateSettingsStructure((settings) => {
    settings.sections.push(createDefaultSection(settings.sections.length));
  });
}

export function persistState({ app, refreshConfigSummary }) {
  const result = savePersistedState(app.state);
  app.saveStatus = result.status;
  refreshConfigSummary();
}
