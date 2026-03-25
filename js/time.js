export function parseMinutesSeconds(minutesValue, secondsValue) {
  const minutes = Number(minutesValue);
  const seconds = Number(secondsValue);
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;

  return safeMinutes * 60 + safeSeconds;
}

export function parseHoursMinutesSeconds(hoursValue, minutesValue, secondsValue) {
  const hours = Number(hoursValue);
  const minutes = Number(minutesValue);
  const seconds = Number(secondsValue);
  const safeHours = Number.isFinite(hours) ? Math.max(0, Math.floor(hours)) : 0;
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.floor(minutes)) : 0;
  const safeSeconds = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;

  return safeHours * 3600 + safeMinutes * 60 + safeSeconds;
}

export function splitMinutesSeconds(totalSeconds) {
  const safeTotalSeconds = Math.max(0, Math.floor(totalSeconds));

  return {
    minutes: Math.floor(safeTotalSeconds / 60),
    seconds: safeTotalSeconds % 60,
  };
}

export function splitHoursMinutesSeconds(totalSeconds) {
  const safeTotalSeconds = Math.max(0, Math.floor(totalSeconds));

  return {
    hours: Math.floor(safeTotalSeconds / 3600),
    minutes: Math.floor((safeTotalSeconds % 3600) / 60),
    seconds: safeTotalSeconds % 60,
  };
}

export function formatClockSeconds(totalSeconds, { forceNegative = false } = {}) {
  const negative = totalSeconds < 0 || forceNegative;
  const absoluteSeconds = Math.abs(Math.trunc(totalSeconds));
  const hours = Math.floor(absoluteSeconds / 3600);
  const minutes = Math.floor((absoluteSeconds % 3600) / 60);
  const seconds = absoluteSeconds % 60;
  const sign = negative ? "-" : "";

  if (hours > 0) {
    return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${sign}${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatClockMilliseconds(milliseconds, mode = "elapsed") {
  const safeMilliseconds = Number.isFinite(milliseconds) ? milliseconds : 0;
  const negative = safeMilliseconds < 0;
  const absoluteMilliseconds = Math.abs(safeMilliseconds);
  const absoluteSeconds =
    mode === "countdown" && !negative
      ? Math.ceil(absoluteMilliseconds / 1000)
      : Math.floor(absoluteMilliseconds / 1000);

  return formatClockSeconds(negative ? -absoluteSeconds : absoluteSeconds, {
    forceNegative: negative,
  });
}

export function formatHumanDuration(totalSeconds) {
  const safeTotalSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeTotalSeconds / 3600);
  const minutes = Math.floor((safeTotalSeconds % 3600) / 60);
  const seconds = safeTotalSeconds % 60;

  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min ${String(seconds).padStart(2, "0")} s`;
  }

  return `${minutes} min ${String(seconds).padStart(2, "0")} s`;
}
