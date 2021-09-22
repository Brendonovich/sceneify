export const performance: import("perf_hooks").Performance =
  (global as any).window !== undefined
    ? (global as any).performance
    : require("perf_hooks").performance;
