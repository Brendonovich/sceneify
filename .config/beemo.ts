export default {
  module: "@beemo/dev",
  drivers: [
    ["jest", {}],
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
