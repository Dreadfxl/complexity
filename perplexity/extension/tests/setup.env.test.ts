import { describe, it, expect, beforeEach, vi } from "vitest";

// These tests rely on Key enum and invariant being available in the test environment
// Provide minimal shims to prevent ReferenceError while preserving behavior

// Shim Key enum used in command-menu manifest
// @ts-ignore
(global as any).Key = {
  Meta: "Meta",
  Control: "Control",
};

// Shim invariant used in guards
function invariant(condition: any, message?: string): asserts condition {
  if (!condition) throw new Error(message || "Invariant failed");
}
// @ts-ignore
(global as any).invariant = invariant;

// basic smoke test to ensure shims load before other suites import modules
describe("test environment shims", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  it("has Key shim", () => {
    expect((global as any).Key.Meta).toBe("Meta");
  });
  it("has invariant shim", () => {
    expect(() => (global as any).invariant(true)).not.toThrow();
  });
});
