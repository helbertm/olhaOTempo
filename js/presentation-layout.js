function getViewportDimensions(windowRef = window) {
  const visualViewport = windowRef.visualViewport;

  if (
    visualViewport &&
    Number.isFinite(visualViewport.width) &&
    Number.isFinite(visualViewport.height)
  ) {
    return {
      width: Math.round(visualViewport.width),
      height: Math.round(visualViewport.height),
    };
  }

  return {
    width: Math.round(windowRef.innerWidth),
    height: Math.round(windowRef.innerHeight),
  };
}

export function getPresentationViewportMode(windowRef = window) {
  const { width, height } = getViewportDimensions(windowRef);
  const shortestSide = Math.min(width, height);
  const isLandscape = width > height;

  if (shortestSide >= 900) {
    return "desktop";
  }

  if (shortestSide >= 700) {
    return "tablet";
  }

  if (isLandscape || height <= 500) {
    return "compact-landscape";
  }

  return "compact-portrait";
}
