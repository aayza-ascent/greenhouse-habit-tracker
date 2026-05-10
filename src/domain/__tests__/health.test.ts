import { applyCompletion, applyMiss, stageFromHealth } from "../health";

describe("stageFromHealth — banding", () => {
  test("dead band (0-19) returns 11", () => {
    expect(stageFromHealth(0, 99, 99)).toBe(11);
    expect(stageFromHealth(19, 99, 99)).toBe(11);
  });
  test("dying band (20-29) returns 10", () => {
    expect(stageFromHealth(20, 99, 99)).toBe(10);
    expect(stageFromHealth(29, 99, 99)).toBe(10);
  });
  test("sad wilting band (30-39) returns 9", () => {
    expect(stageFromHealth(30, 99, 99)).toBe(9);
    expect(stageFromHealth(39, 99, 99)).toBe(9);
  });
  test("wilting band (40-49) returns 8", () => {
    expect(stageFromHealth(40, 99, 99)).toBe(8);
    expect(stageFromHealth(49, 99, 99)).toBe(8);
  });
});

describe("stageFromHealth — healthy bands gated by streak / ticks", () => {
  test("seeded at health 50 with streak 0 returns 0", () => {
    expect(stageFromHealth(50, 0, 0)).toBe(0);
  });
  test("sprouting at health 50 with streak 1 returns 1", () => {
    expect(stageFromHealth(50, 1, 0)).toBe(1);
  });
  test("growing at health 50 with streak 2 returns 2", () => {
    expect(stageFromHealth(50, 2, 0)).toBe(2);
  });
  test("budding at health 55 with streak 3 returns 3", () => {
    expect(stageFromHealth(55, 3, 0)).toBe(3);
  });
  test("flowering at health 65 returns 4", () => {
    expect(stageFromHealth(65, 5, 0)).toBe(4);
  });
  test("fully flowered at health 75 returns 5", () => {
    expect(stageFromHealth(75, 5, 0)).toBe(5);
  });
  test("thriving requires streak ≥ 7 — 6 returns fully flowered", () => {
    expect(stageFromHealth(85, 6, 0)).toBe(5);
    expect(stageFromHealth(85, 7, 0)).toBe(6);
  });
  test("extra thriving requires streak ≥ 7 AND ticksAtFull ≥ 2", () => {
    expect(stageFromHealth(96, 7, 1)).toBe(6); // not enough ticks
    expect(stageFromHealth(96, 7, 2)).toBe(7);
    expect(stageFromHealth(100, 30, 5)).toBe(7);
  });
});

describe("stageFromHealth — flowering bands require streak ≥ 3", () => {
  // After 1 completion: streak=1, health=62. Must be sprouting, not flowering.
  test("one completion stays sprouting even at health 62", () => {
    expect(stageFromHealth(62, 1, 0)).toBe(1);
  });
  // After 2 completions: streak=2, health=74. Must be growing, not fully flowered.
  test("two completions stays growing even at health 74", () => {
    expect(stageFromHealth(74, 2, 0)).toBe(2);
  });
  // After 3 completions: streak=3, health=86. NOW it can flower.
  test("three completions unlocks fully flowered at health 86", () => {
    expect(stageFromHealth(86, 3, 0)).toBe(5);
  });
  test("high health with streak < 3 never crosses into flowering bands", () => {
    expect(stageFromHealth(100, 0, 0)).toBe(0);
    expect(stageFromHealth(100, 1, 0)).toBe(1);
    expect(stageFromHealth(100, 2, 0)).toBe(2);
  });
});

describe("stageFromHealth — band boundaries are inclusive on the upper edge", () => {
  test.each([
    [19, 11],
    [20, 10],
    [29, 10],
    [30, 9],
    [49, 8],
    [50, 0], // streak 0 → seeded
  ])("health %d → stage %d", (health, expected) => {
    expect(stageFromHealth(health, 0, 0)).toBe(expected);
  });
});

describe("applyCompletion / applyMiss", () => {
  test("completion bumps health by 12 capped at 100", () => {
    expect(applyCompletion(50)).toBe(62);
    expect(applyCompletion(95)).toBe(100);
    expect(applyCompletion(100)).toBe(100);
  });
  test("miss decay scales by frequency", () => {
    expect(applyMiss(50, "daily")).toBe(35);
    expect(applyMiss(50, "weekly")).toBe(42);
    expect(applyMiss(10, "daily")).toBe(0); // floor at zero
  });
});
