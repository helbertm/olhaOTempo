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
];

for (const pattern of REQUIRED_PATTERNS) {
  if (!pattern.test(html)) {
    console.error(`HTML guardrail missing pattern: ${pattern}`);
    process.exit(1);
  }
}

console.log("HTML guardrails OK.");
