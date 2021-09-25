import buildConfig from "./jest.base.config";

module.exports = buildConfig(__dirname, {
  projects: ["<rootDir>/packages/*/jest.config.ts"],
  // collectCoverageFrom: ["<rootDir>/packages/*/src/**/*.ts"]
});
