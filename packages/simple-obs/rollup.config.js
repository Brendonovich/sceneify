import config from "../../rollup.config";

const name = require("simple-obs/package").browser.replace(/\.js$/, "");

export default config(name);
