/**
 * Creates a git tag from the root package.json version.
 */

const exec = require("child_process").exec;

exec(`git tag v${process.env.npm_package_version}`);
