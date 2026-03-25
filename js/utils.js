export function createId(prefix = "id") {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}-${randomId}`;
}

export function clampNumber(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}
