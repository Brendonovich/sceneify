export default {
  coveragePathIgnorePatterns: ["website/src"],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 99,
      lines: 99,
      statements: 99,
    },
  },
  testPathIgnorePatterns: ["src/test.ts"],
};
