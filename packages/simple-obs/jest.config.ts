import buildConfig from "../../jest.base.config";

export default buildConfig(__dirname, {
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
});