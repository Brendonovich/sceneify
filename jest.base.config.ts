import fs from "fs";
import path from "path";
import type { Config } from "@jest/types";

const tsConfig = "tsconfig.test.json";

export default function buildConfig(
  packageDirectory: string,
  pkgConfig: Config.InitialOptions
): Config.InitialOptions {
  const packageName = require(`${packageDirectory}/package.json`).name;
  const packageTsconfig = path.resolve(packageDirectory, tsConfig);
  return {
    preset: "ts-jest",
    globals: {
      __DEV__: true,
      "ts-jest": {
        tsconfig: fs.existsSync(packageTsconfig)
          ? packageTsconfig
          : path.resolve(__dirname, tsConfig),
      },
    },
    testRegex: "tests\\/.*\\.test\\.ts$",
    coverageDirectory: "<rootDir>/coverage/",
    coverageReporters: ["lcov", "text"],
    collectCoverageFrom: ["<rootDir>/src/**/*.{ts,tsx}", "!**/node_modules/**"],
    displayName: packageName,
    ...pkgConfig,
  };
}
