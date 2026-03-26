import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

test("markup principal preserva semantica critica de acessibilidade", () => {
  assert.match(html, /id="theme-switch-group"[\s\S]*role="radiogroup"/);
  assert.match(html, /id="app-live-region"[\s\S]*aria-live="polite"[\s\S]*aria-atomic="true"/);
  assert.match(html, /id="section-timer-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/);
  assert.match(html, /id="total-timer-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/);
  assert.match(html, /id="overtime-value"[\s\S]*role="timer"[\s\S]*aria-live="off"/);
});
