export function showToast(elements, message) {
  if (!message) {
    return;
  }

  announceMessage(elements.liveRegion, message);

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  elements.toastRegion.append(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 4200);
}

function announceMessage(liveRegion, message) {
  if (!(liveRegion instanceof HTMLElement)) {
    return;
  }

  liveRegion.textContent = "";

  window.setTimeout(() => {
    liveRegion.textContent = message;
  }, 30);
}
