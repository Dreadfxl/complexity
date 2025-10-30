// Global test setup for Vitest
// Provides shims required by some source modules when running in Node test env

// Key enum used by command-menu manifest
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (!(global as any).Key) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  (global as any).Key = { Meta: 'Meta', Control: 'Control' };
}

// Minimal invariant implementation used in guards
function invariant(condition: any, message?: string): asserts condition {
  if (!condition) throw new Error(message || 'Invariant failed');
}
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
(global as any).invariant = (global as any).invariant || invariant;
