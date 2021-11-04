export default {
  module: "@beemo/dev",
  drivers: [
    "babel",
    [
      "jest",
      {
        env: {
          NODE_ENV: "test",
        },
      },
    ],
    "prettier",
    [
      "typescript",
      {
        buildFolder: "dts",
        declarationOnly: true,
      },
    ],
  ],
  settings: {
    node: true,
  },
};
