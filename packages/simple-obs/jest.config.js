const buildConfig = require("../../jest.base.config");

module.exports = buildConfig(__dirname, {
  testRegex: "tests\\/.*\\.ts$",
});
