function getFullscreenElement(documentRef = document) {
  return documentRef.fullscreenElement ?? documentRef.webkitFullscreenElement ?? null;
}

function isFullscreenEnabled(documentRef = document) {
  return Boolean(documentRef.fullscreenEnabled ?? documentRef.webkitFullscreenEnabled);
}

export function isAppleMobileDevice(navigatorRef = navigator) {
  const userAgent = navigatorRef?.userAgent ?? "";
  const platform = navigatorRef?.platform ?? "";
  const maxTouchPoints = navigatorRef?.maxTouchPoints ?? 0;

  return (
    /iPhone|iPad|iPod/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  );
}

export function isStandaloneDisplay(windowRef = window, navigatorRef = navigator) {
  const standaloneMode =
    typeof windowRef?.matchMedia === "function" &&
    windowRef.matchMedia("(display-mode: standalone)").matches;
  const fullscreenMode =
    typeof windowRef?.matchMedia === "function" &&
    windowRef.matchMedia("(display-mode: fullscreen)").matches;
  const legacyStandalone = navigatorRef?.standalone === true;

  return standaloneMode || fullscreenMode || legacyStandalone;
}

export function getFullscreenState({
  documentRef = document,
  windowRef = window,
  navigatorRef = navigator,
} = {}) {
  const requestSupported = isFullscreenEnabled(documentRef);
  const standalone = isStandaloneDisplay(windowRef, navigatorRef);

  return {
    supported: requestSupported || standalone,
    active: standalone || Boolean(getFullscreenElement(documentRef)),
    requestSupported,
    standalone,
    installHint:
      !requestSupported && !standalone && isAppleMobileDevice(navigatorRef)
        ? "ios-home-screen"
        : null,
  };
}

async function requestFullscreen(element) {
  if (typeof element.requestFullscreen === "function") {
    return element.requestFullscreen();
  }

  if (typeof element.webkitRequestFullscreen === "function") {
    return element.webkitRequestFullscreen();
  }

  throw new Error("fullscreen-unsupported");
}

async function exitFullscreen(documentRef = document) {
  if (typeof documentRef.exitFullscreen === "function") {
    return documentRef.exitFullscreen();
  }

  if (typeof documentRef.webkitExitFullscreen === "function") {
    return documentRef.webkitExitFullscreen();
  }

  throw new Error("fullscreen-unsupported");
}

export class FullscreenController {
  constructor({ documentRef = document, windowRef = window, navigatorRef = navigator, onChange } = {}) {
    this.documentRef = documentRef;
    this.windowRef = windowRef;
    this.navigatorRef = navigatorRef;
    this.onChange = onChange;

    this.handleChange = this.handleChange.bind(this);
    this.documentRef.addEventListener("fullscreenchange", this.handleChange);
    this.documentRef.addEventListener("webkitfullscreenchange", this.handleChange);
  }

  getState() {
    return getFullscreenState({
      documentRef: this.documentRef,
      windowRef: this.windowRef,
      navigatorRef: this.navigatorRef,
    });
  }

  notify() {
    this.onChange?.(this.getState());
  }

  handleChange() {
    this.notify();
  }

  async enter(element) {
    const state = this.getState();

    if (state.standalone) {
      return {
        ok: true,
        code: "active",
      };
    }

    if (!state.requestSupported) {
      return {
        ok: false,
        code: state.installHint ? "install-required" : "unsupported",
      };
    }

    try {
      await requestFullscreen(element);
      this.notify();

      return {
        ok: true,
        code: "active",
      };
    } catch (error) {
      return {
        ok: false,
        code: "blocked",
        error,
      };
    }
  }

  async exit() {
    const state = this.getState();

    if (state.standalone) {
      return {
        ok: true,
        code: "standalone",
      };
    }

    if (!state.active) {
      return {
        ok: true,
        code: "inactive",
      };
    }

    try {
      await exitFullscreen(this.documentRef);
      this.notify();

      return {
        ok: true,
        code: "inactive",
      };
    } catch (error) {
      return {
        ok: false,
        code: "blocked",
        error,
      };
    }
  }

  async toggle(element) {
    const state = this.getState();

    if (state.standalone) {
      return {
        ok: true,
        code: "standalone",
      };
    }

    return state.active ? this.exit() : this.enter(element);
  }
}

export class WakeLockController {
  constructor({ navigatorRef = navigator, documentRef = document, onChange } = {}) {
    this.navigatorRef = navigatorRef;
    this.documentRef = documentRef;
    this.onChange = onChange;
    this.sentinel = null;
    this.shouldPersist = false;

    this.handleRelease = this.handleRelease.bind(this);
  }

  isSupported() {
    return Boolean(this.navigatorRef?.wakeLock?.request);
  }

  getState() {
    return {
      supported: this.isSupported(),
      active: Boolean(this.sentinel),
      shouldPersist: this.shouldPersist,
    };
  }

  notify(extraState = {}) {
    this.onChange?.({
      ...this.getState(),
      ...extraState,
    });
  }

  async request() {
    this.shouldPersist = true;

    if (!this.isSupported()) {
      this.shouldPersist = false;
      this.notify({ code: "unsupported" });

      return {
        ok: false,
        code: "unsupported",
      };
    }

    try {
      if (!this.sentinel) {
        this.sentinel = await this.navigatorRef.wakeLock.request("screen");
        this.sentinel.addEventListener("release", this.handleRelease);
      }

      this.notify({ code: "active" });

      return {
        ok: true,
        code: "active",
      };
    } catch (error) {
      this.shouldPersist = false;
      this.notify({ code: "blocked", error });

      return {
        ok: false,
        code: "blocked",
        error,
      };
    }
  }

  async release() {
    this.shouldPersist = false;

    if (this.sentinel) {
      try {
        this.sentinel.removeEventListener("release", this.handleRelease);
        await this.sentinel.release();
      } catch (error) {
        this.notify({ code: "error", error });
      } finally {
        this.sentinel = null;
      }
    }

    this.notify({ code: "inactive" });

    return {
      ok: true,
      code: "inactive",
    };
  }

  async handleRelease() {
    this.sentinel = null;
    this.notify({
      code: this.shouldPersist ? "released" : "inactive",
    });
  }

  async syncWithVisibility() {
    if (!this.shouldPersist || this.documentRef.visibilityState !== "visible") {
      this.notify({ code: this.sentinel ? "active" : "inactive" });

      return {
        ok: true,
        code: this.sentinel ? "active" : "inactive",
      };
    }

    if (!this.sentinel) {
      return this.request();
    }

    this.notify({ code: "active" });
    return {
      ok: true,
      code: "active",
    };
  }
}
