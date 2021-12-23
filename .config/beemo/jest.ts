import { JestConfig } from "@beemo/driver-jest";

export default {
  preset: "ts-jest",
  projects: [
    "packages/*"
  ]
} as JestConfig;
