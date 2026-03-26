import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const REQUIRED_SWITCHES = [
  ["auto-fullscreen-enabled", "auto-fullscreen-label"],
  ["show-presentation-timer", "show-presentation-timer-label"],
  ["show-current-section", "show-current-section-label"],
  ["show-next-section", "show-next-section-label"],
  ["manual-total-enabled", "manual-total-enabled-label"],
  ["keep-screen-awake-enabled", "keep-screen-awake-enabled-label"],
  ["auto-start-enabled", "auto-start-enabled-label"],
];

test("markup principal preserva semantica critica de acessibilidade", () => {
  assert.match(html, /id="theme-switch-group"[\s\S]*role="radiogroup"/);
  assert.match(html, /id="app-live-region"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"/);
  assert.match(html, /id="section-timer-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/);
  assert.match(html, /id="total-timer-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/);
  assert.match(html, /id="overtime-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/);
  assert.match(html, /id="back-to-top-button"[\s\S]*aria-label="Voltar ao topo"/);
});

test("switches possuem rotulo visual ligado semanticamente ao checkbox", () => {
  for (const [inputId, labelId] of REQUIRED_SWITCHES) {
    assert.match(
      html,
      new RegExp(`<label class="config-switch-item"[^>]*for="${inputId}"[\\s\\S]*?<strong id="${labelId}">`),
    );
    assert.match(
      html,
      new RegExp(`<input[\\s\\S]*id="${inputId}"[\\s\\S]*aria-labelledby="${labelId}"`),
    );
  }
});
