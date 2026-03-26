import { execFileSync } from "node:child_process";

const files = [
  "js/app-bootstrap.js",
  "js/app.js",
  "js/capabilities.js",
  "js/constants.js",
  "js/defaults.js",
  "js/dom.js",
  "js/model.js",
  "js/notifications.js",
  "js/presentation-controls.js",
  "js/presentation-layout.js",
  "js/presentation-ui.js",
  "js/state-sync.js",
  "js/storage.js",
  "js/time.js",
  "js/timer-engine.js",
  "js/ui-config.js",
  "js/utils.js",
  "tests/capabilities.test.js",
  "tests/markup-a11y.test.js",
  "tests/presentation-layout.test.js",
  "tests/presentation-ui.test.js",
  "tests/storage.test.js",
  "tests/time.test.js",
  "tests/timer-engine.test.js",
];

for (const file of files) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

console.log("JavaScript syntax guardrails OK.");
