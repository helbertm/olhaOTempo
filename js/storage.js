import { STORAGE_KEY } from "./constants.js";
import { createDefaultAppState } from "./defaults.js";
import { normalizeAppState } from "./model.js";

function resolveStorage(explicitStorage) {
  if (explicitStorage) {
    return explicitStorage;
  }

  try {
    return globalThis.localStorage ?? null;
  } catch (error) {
    return null;
  }
}

export function loadPersistedState(storage) {
  const safeStorage = resolveStorage(storage);

  if (!safeStorage) {
    return {
      state: createDefaultAppState(),
      status: "unavailable",
    };
  }

  try {
    const rawValue = safeStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return {
        state: createDefaultAppState(),
        status: "empty",
      };
    }

    const parsedValue = JSON.parse(rawValue);

    return {
      state: normalizeAppState(parsedValue),
      status: "loaded",
    };
  } catch (error) {
    return {
      state: createDefaultAppState(),
      status: "recovered",
      error,
    };
  }
}

export function savePersistedState(state, storage) {
  const safeStorage = resolveStorage(storage);

  if (!safeStorage) {
    return {
      ok: false,
      status: "unavailable",
    };
  }

  try {
    const normalizedState = normalizeAppState(state);
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedState));

    return {
      ok: true,
      status: "saved",
    };
  } catch (error) {
    return {
      ok: false,
      status: "error",
      error,
    };
  }
}

export function clearPersistedState(storage) {
  const safeStorage = resolveStorage(storage);

  if (!safeStorage) {
    return;
  }

  safeStorage.removeItem(STORAGE_KEY);
}
