import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const REQUIRED_PATTERNS = [
  /id="config-view"/,
  /id="presentation-view"/,
  /id="theme-switch-group"[\s\S]*role="radiogroup"/,
  /id="app-live-region"[\s\S]*aria-live="polite"/,
  /id="section-timer-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/,
  /id="total-timer-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/,
  /id="overtime-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/,
  /id="back-to-top-button"[\s\S]*aria-label="Voltar ao topo"/,
  /<details class="alerts-disclosure alerts-block">/,
];
const REQUIRED_SWITCHES = [
  ["auto-fullscreen-enabled", "auto-fullscreen-label"],
  ["show-presentation-timer", "show-presentation-timer-label"],
  ["show-current-section", "show-current-section-label"],
  ["show-next-section", "show-next-section-label"],
  ["manual-total-enabled", "manual-total-enabled-label"],
  ["keep-screen-awake-enabled", "keep-screen-awake-enabled-label"],
  ["auto-start-enabled", "auto-start-enabled-label"],
];

for (const pattern of REQUIRED_PATTERNS) {
  if (!pattern.test(html)) {
    console.error(`HTML guardrail missing pattern: ${pattern}`);
    process.exit(1);
  }
}

for (const [inputId, labelId] of REQUIRED_SWITCHES) {
  const labelPattern = new RegExp(
    `<label class="config-switch-item"[^>]*for="${inputId}"[\\s\\S]*?<strong id="${labelId}">`,
  );
  const inputPattern = new RegExp(
    `<input[\\s\\S]*id="${inputId}"[\\s\\S]*aria-labelledby="${labelId}"`,
  );

  if (!labelPattern.test(html) || !inputPattern.test(html)) {
    console.error(`HTML guardrail missing accessible switch binding for ${inputId}.`);
    process.exit(1);
  }
}

console.log("HTML guardrails OK.");
