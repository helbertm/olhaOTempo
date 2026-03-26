const MAX_BACK_TO_TOP_THRESHOLD_PX = 320;
const DESKTOP_THRESHOLD_RATIO = 0.25;
const MOBILE_THRESHOLD_RATIO = 0.22;

export function getBackToTopThreshold({
  viewportWidth,
  viewportHeight,
}) {
  const resolvedHeight = Number.isFinite(viewportHeight) && viewportHeight > 0
    ? viewportHeight
    : 800;
  const isMobileViewport = Number.isFinite(viewportWidth) && viewportWidth > 0
    ? viewportWidth <= 760
    : false;
  const ratio = isMobileViewport ? MOBILE_THRESHOLD_RATIO : DESKTOP_THRESHOLD_RATIO;

  return Math.min(
    MAX_BACK_TO_TOP_THRESHOLD_PX,
    Math.round(resolvedHeight * ratio),
  );
}

export function shouldShowBackToTop({
  view,
  scrollY,
  viewportWidth,
  viewportHeight,
}) {
  if (view !== "edit") {
    return false;
  }

  return scrollY >= getBackToTopThreshold({
    viewportWidth,
    viewportHeight,
  });
}

export function getBackToTopScrollBehavior(prefersReducedMotion) {
  return prefersReducedMotion ? "auto" : "smooth";
}

export function createBackToTopController({
  app,
  elements,
  windowRef = window,
  documentRef = document,
}) {
  if (!elements.backToTopButton) {
    return {
      update() {},
      handleScroll() {},
      scrollToTop() {},
    };
  }

  const reducedMotionQuery = typeof windowRef.matchMedia === "function"
    ? windowRef.matchMedia("(prefers-reduced-motion: reduce)")
    : null;
  let pendingFrame = 0;

  function readViewport() {
    const visualViewport = windowRef.visualViewport;
    const viewportWidth = Number.isFinite(visualViewport?.width)
      ? visualViewport.width
      : windowRef.innerWidth;
    const viewportHeight = Number.isFinite(visualViewport?.height)
      ? visualViewport.height
      : windowRef.innerHeight;

    return {
      viewportWidth,
      viewportHeight,
    };
  }

  function readScrollY() {
    return Math.max(
      windowRef.scrollY ?? 0,
      documentRef.documentElement?.scrollTop ?? 0,
      documentRef.body?.scrollTop ?? 0,
    );
  }

  function update() {
    const { viewportWidth, viewportHeight } = readViewport();
    const isVisible = shouldShowBackToTop({
      view: app.state.runtime.view,
      scrollY: readScrollY(),
      viewportWidth,
      viewportHeight,
    });

    elements.backToTopButton.classList.toggle("hidden", !isVisible);
  }

  function handleScroll() {
    if (typeof windowRef.requestAnimationFrame !== "function") {
      update();
      return;
    }

    if (pendingFrame !== 0) {
      return;
    }

    pendingFrame = windowRef.requestAnimationFrame(() => {
      pendingFrame = 0;
      update();
    });
  }

  function scrollToTop() {
    windowRef.scrollTo({
      top: 0,
      behavior: getBackToTopScrollBehavior(reducedMotionQuery?.matches ?? false),
    });
  }

  return {
    update,
    handleScroll,
    scrollToTop,
  };
}
