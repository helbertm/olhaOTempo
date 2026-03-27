import {
  getBackToTopScrollBehavior,
  shouldShowBackToTop,
} from "./back-to-top.js";

export function isElementInViewport(element, {
  viewportWidth,
  viewportHeight,
}) {
  if (!element || typeof element.getBoundingClientRect !== "function") {
    return false;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < viewportHeight &&
    rect.left < viewportWidth
  );
}

export function shouldShowQuickStart({
  view,
  inlineActionVisible,
}) {
  if (view !== "edit") {
    return false;
  }

  return !inlineActionVisible;
}

export function createFloatingActionController({
  app,
  elements,
  windowRef = window,
  documentRef = document,
}) {
  if (!elements.backToTopButton && !elements.quickStartButton) {
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
    const viewport = readViewport();
    const view = app.state.runtime.view;
    const inlineActionVisible = isElementInViewport(elements.openPresentationButton, viewport);
    const showBackToTop = shouldShowBackToTop({
      view,
      scrollY: readScrollY(),
      ...viewport,
    });
    const showQuickStart = shouldShowQuickStart({
      view,
      inlineActionVisible,
    });

    elements.backToTopButton?.classList.toggle("hidden", !showBackToTop);
    elements.quickStartButton?.classList.toggle("hidden", !showQuickStart);
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
