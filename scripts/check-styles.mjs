import { readFileSync } from "node:fs";

const css = readFileSync("styles.css", "utf8");
const REQUIRED_TOKENS = [
  "--space-1",
  "--type-overline",
  "--state-focus-ring",
  "--state-quiet-opacity",
  "--control-pill-radius",
  "--panel-padding-md",
  "@media (prefers-reduced-motion: reduce)",
  '[data-content-layout="split"]',
  '[data-controls-layout="compact-grid"]',
  '[data-title-density="tight"]',
  ".floating-action-stack",
  ".floating-action-button",
  ".back-to-top-button",
];

for (const token of REQUIRED_TOKENS) {
  if (!css.includes(token)) {
    console.error(`Stylesheet guardrail missing token: ${token}`);
    process.exit(1);
  }
}

console.log("Stylesheet guardrails OK.");
