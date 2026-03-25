import assert from "node:assert/strict";
import test from "node:test";

import {
  formatClockMilliseconds,
  parseHoursMinutesSeconds,
  splitHoursMinutesSeconds,
} from "../js/time.js";

test("modo regressivo arredonda para cima enquanto ainda há tempo positivo", () => {
  assert.equal(formatClockMilliseconds(59_001, "countdown"), "01:00");
  assert.equal(formatClockMilliseconds(60_000, "countdown"), "01:00");
});

test("modo regressivo preserva o sinal negativo no overtime", () => {
  assert.equal(formatClockMilliseconds(-1, "countdown"), "-00:00");
  assert.equal(formatClockMilliseconds(-1_200, "countdown"), "-00:01");
});

test("modo decorrido arredonda para baixo", () => {
  assert.equal(formatClockMilliseconds(59_900, "elapsed"), "00:59");
});

test("duracao planejada aceita hora minuto e segundo", () => {
  const totalSeconds = parseHoursMinutesSeconds(1, 20, 15);
  const parts = splitHoursMinutesSeconds(totalSeconds);

  assert.equal(totalSeconds, 4_815);
  assert.deepEqual(parts, {
    hours: 1,
    minutes: 20,
    seconds: 15,
  });
});
