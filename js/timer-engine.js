import { createIdleSession } from "./defaults.js";
import { getSectionsTotalSeconds } from "./model.js";

export function hasActiveSession(session) {
  return session.status === "running" || session.status === "paused";
}

export function startSession(nowMs = Date.now()) {
  return {
    status: "running",
    startedAtMs: nowMs,
    pausedAtMs: null,
    pausedAccumulatedMs: 0,
  };
}

export function pauseSession(session, nowMs = Date.now()) {
  if (session.status !== "running") {
    return session;
  }

  return {
    ...session,
    status: "paused",
    pausedAtMs: nowMs,
  };
}

export function resumeSession(session, nowMs = Date.now()) {
  if (session.status !== "paused" || session.startedAtMs === null || session.pausedAtMs === null) {
    return session;
  }

  return {
    status: "running",
    startedAtMs: session.startedAtMs,
    pausedAtMs: null,
    pausedAccumulatedMs:
      session.pausedAccumulatedMs + Math.max(0, nowMs - session.pausedAtMs),
  };
}

export function resetSession() {
  return createIdleSession();
}

export function getElapsedMs(session, nowMs = Date.now()) {
  if (!hasActiveSession(session) || session.startedAtMs === null) {
    return 0;
  }

  if (session.status === "paused" && session.pausedAtMs !== null) {
    return Math.max(
      0,
      session.pausedAtMs - session.startedAtMs - session.pausedAccumulatedMs,
    );
  }

  return Math.max(0, nowMs - session.startedAtMs - session.pausedAccumulatedMs);
}

export function buildSectionTimeline(sections) {
  let cursorMs = 0;

  return sections.map((section) => {
    const durationMs = section.durationSeconds * 1000;
    const timelineEntry = {
      ...section,
      startMs: cursorMs,
      endMs: cursorMs + durationMs,
      durationMs,
    };

    cursorMs += durationMs;
    return timelineEntry;
  });
}

export function derivePresentationSnapshot(settings, session, nowMs = Date.now()) {
  const totalElapsedMs = getElapsedMs(session, nowMs);
  const timeline = buildSectionTimeline(settings.sections);
  const sectionsTotalMs = getSectionsTotalSeconds(settings) * 1000;
  const routeRemainingMs = sectionsTotalMs - totalElapsedMs;
  const currentSection = timeline.find(
    (timelineEntry) => totalElapsedMs >= timelineEntry.startMs && totalElapsedMs < timelineEntry.endMs,
  );

  if (!currentSection) {
    return {
      totalElapsedMs,
      routeRemainingMs,
      currentSectionIndex: -1,
      currentSection: null,
      currentSectionElapsedMs: 0,
      currentSectionRemainingMs: 0,
      nextSection: null,
      activeAlerts: [],
      isFinalOvertime: timeline.length > 0 && totalElapsedMs >= sectionsTotalMs,
      finalOvertimeMs: Math.max(0, totalElapsedMs - sectionsTotalMs),
    };
  }

  const currentSectionElapsedMs = totalElapsedMs - currentSection.startMs;
  const currentSectionRemainingMs = currentSection.endMs - totalElapsedMs;
  const currentSectionIndex = timeline.findIndex(
    (timelineEntry) => timelineEntry.id === currentSection.id,
  );
  const nextSection = timeline[currentSectionIndex + 1] ?? null;
  const activeAlerts = currentSection.alerts.filter((alert) => {
    const deltaMs = currentSectionElapsedMs - alert.elapsedSeconds * 1000;
    return deltaMs >= 0 && deltaMs < alert.highlightSeconds * 1000;
  });

  return {
    totalElapsedMs,
    routeRemainingMs,
    currentSectionIndex,
    currentSection,
    currentSectionElapsedMs,
    currentSectionRemainingMs,
    nextSection,
    activeAlerts,
    isFinalOvertime: false,
    finalOvertimeMs: 0,
  };
}
